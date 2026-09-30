<?php

namespace App\Http\Controllers;

use App\Models\DiaryEntry;
use App\Models\Envelope;
use App\Models\SanctuaryStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SanctuaryController extends Controller
{
    // Check the passcode before letting anyone into the cozy room.
    public function unlock(Request $request): JsonResponse
    {
        $valid = hash_equals((string) config('sanctuary.pin'), (string) $request->input('pin'));

        return response()->json(['unlocked' => $valid], $valid ? 200 : 422);
    }

    // Send the saved notes, envelopes, and heart count to the website.
    public function index(Request $request): JsonResponse
    {
        $this->ensureAccess($request);

        return response()->json([
            'posts' => DiaryEntry::query()->latest()->get()->map(fn (DiaryEntry $entry) => [
                'id' => (string) $entry->id,
                'title' => $entry->title,
                'tag' => $entry->tag,
                'date' => $entry->date,
                'content' => $entry->content,
                'imageUrl' => $entry->image_url,
                'spotifyPlaylistUrl' => $entry->spotify_playlist_url,
                'likes' => $entry->likes,
            ]),
            'envelopes' => Envelope::query()->latest()->get()->map(fn (Envelope $envelope) => [
                'id' => (string) $envelope->id,
                'title' => $envelope->title,
                'category' => $envelope->category,
                'content' => $envelope->content,
            ]),
            'pingCount' => (int) SanctuaryStat::query()->whereKey('pings')->value('value'),
        ]);
    }

    // Add one to the little "thinking of you" heart counter.
    public function ping(Request $request): JsonResponse
    {
        $this->ensureAccess($request);

        $stat = SanctuaryStat::query()->firstOrCreate(['key' => 'pings'], ['value' => 0]);
        $stat->increment('value');

        return response()->json(['pingCount' => $stat->fresh()->value]);
    }

    // Give a note one more bit of love.
    public function like(Request $request, DiaryEntry $entry): JsonResponse
    {
        $this->ensureAccess($request);

        $entry->increment('likes');

        return response()->json(['likes' => $entry->fresh()->likes]);
    }

    // Save a new diary note, memory, poem, or Spotify song.
    public function storePost(Request $request): JsonResponse
    {
        $this->ensureAuthor($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'in:quick-thought,poem,memory,playlist'],
            'date' => ['nullable', 'string', 'max:100'],
            'content' => ['required', 'string', 'max:10000'],
            'imageUrl' => ['nullable', 'url', 'max:2048'],
            'spotifyPlaylistUrl' => ['required_if:tag,playlist', 'nullable', 'url', 'max:2048'],
        ]);
        $entry = DiaryEntry::create([
            ...$data,
            'image_url' => $data['imageUrl'] ?? null,
            'spotify_playlist_url' => $data['spotifyPlaylistUrl'] ?? null,
            'date' => $data['date'] ?? 'Today',
        ]);

        return response()->json(['post' => $entry], 201);
    }

    // Save one of the letters for a special kind of day.
    public function storeEnvelope(Request $request): JsonResponse
    {
        $this->ensureAuthor($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:Comfort,Love,Fun,Night'],
            'content' => ['required', 'string', 'max:10000'],
        ]);

        return response()->json(['envelope' => Envelope::create($data)], 201);
    }

    // Author mode needs the same secret code before it can write.
    private function ensureAuthor(Request $request): void
    {
        $this->ensureAccess($request, 'Author access required.');
    }

    // Keep the private room private by checking the code on every request.
    private function ensureAccess(Request $request, string $message = 'Sanctuary access required.'): void
    {
        abort_unless(hash_equals((string) config('sanctuary.pin'), (string) $request->header('X-Sanctuary-Pin')), 403, $message);
    }
}
