<?php

namespace App\Http\Controllers;

use App\Models\DiaryEntry;
use App\Models\Envelope;
use App\Models\SanctuaryStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SanctuaryController extends Controller
{
    public function unlock(Request $request): JsonResponse
    {
        $valid = hash_equals((string) config('sanctuary.pin'), (string) $request->input('pin'));

        return response()->json(['unlocked' => $valid], $valid ? 200 : 422);
    }

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

    public function ping(Request $request): JsonResponse
    {
        $this->ensureAccess($request);

        $stat = SanctuaryStat::query()->firstOrCreate(['key' => 'pings'], ['value' => 0]);
        $stat->increment('value');

        return response()->json(['pingCount' => $stat->fresh()->value]);
    }

    public function like(Request $request, DiaryEntry $entry): JsonResponse
    {
        $this->ensureAccess($request);

        $entry->increment('likes');

        return response()->json(['likes' => $entry->fresh()->likes]);
    }

    public function storePost(Request $request): JsonResponse
    {
        $this->ensureAuthor($request);
        $entry = DiaryEntry::create($this->postData($request));

        return response()->json(['post' => $entry], 201);
    }

    public function updatePost(Request $request, DiaryEntry $entry): JsonResponse
    {
        $this->ensureAuthor($request);
        $entry->update($this->postData($request));

        return response()->json(['post' => $entry->fresh()]);
    }

    public function destroyPost(Request $request, DiaryEntry $entry): JsonResponse
    {
        $this->ensureAuthor($request);
        $entry->delete();

        return response()->json(['deleted' => true]);
    }

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

    private function ensureAuthor(Request $request): void
    {
        $this->ensureAccess($request, 'Author access required.');
    }

    private function postData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'in:quick-thought,poem,memory,playlist'],
            'date' => ['nullable', 'string', 'max:100'],
            'content' => ['nullable', 'string', 'max:10000'],
            'imageUrl' => ['nullable', 'url', 'max:2048'],
            'spotifyPlaylistUrl' => ['required_if:tag,playlist', 'nullable', 'url', 'max:2048'],
        ]);

        return [
            'title' => $data['title'],
            'tag' => $data['tag'],
            'date' => $data['date'] ?? 'Today',
            'content' => $data['content'] ?? '',
            'image_url' => $data['imageUrl'] ?? null,
            'spotify_playlist_url' => $data['spotifyPlaylistUrl'] ?? null,
        ];
    }

    private function ensureAccess(Request $request, string $message = 'Sanctuary access required.'): void
    {
        abort_unless(hash_equals((string) config('sanctuary.pin'), (string) $request->header('X-Sanctuary-Pin')), 403, $message);
    }
}
