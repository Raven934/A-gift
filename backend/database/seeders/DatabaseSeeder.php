<?php

namespace Database\Seeders;

use App\Models\DiaryEntry;
use App\Models\Envelope;
use App\Models\SanctuaryStat;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    // Put a few sweet starter notes in the empty database.
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        DiaryEntry::firstOrCreate(['title' => 'A little corner for us'], [
            'tag' => 'quick-thought',
            'date' => 'Today',
            'content' => 'No matter where the day takes us, this little corner will always be a place where my thoughts find their way back to you.',
        ]);
        DiaryEntry::firstOrCreate(['title' => 'The moments I keep replaying'], [
            'tag' => 'memory',
            'date' => 'September 21, 2026',
            'content' => 'Some memories arrive quietly: a laugh, a look, a hand held a little longer than usual. I keep all of them close.',
            'likes' => 2,
        ]);
        DiaryEntry::firstOrCreate(['title' => 'Wherever you are'], [
            'tag' => 'poem',
            'date' => 'September 18, 2026',
            'content' => "Wherever you are,\nwhatever the sky becomes,\nthere is a part of my heart\nthat is always coming home.",
            'likes' => 1,
        ]);

        Envelope::firstOrCreate(['title' => 'Open when you miss me'], [
            'category' => 'Comfort',
            'content' => 'Close your eyes and imagine my arms around you. Distance can change the room, but it cannot change how close you are to my heart.',
        ]);
        Envelope::firstOrCreate(['title' => 'Open when you need a smile'], [
            'category' => 'Fun',
            'content' => 'This is your reminder that your smile is one of my favourite things in the entire world. Now go make the day jealous.',
        ]);
        Envelope::firstOrCreate(['title' => 'Open late at night'], [
            'category' => 'Night',
            'content' => 'You do not have to solve everything tonight. Rest, breathe, and remember that tomorrow gets to meet you too.',
        ]);

        SanctuaryStat::firstOrCreate(['key' => 'pings'], ['value' => 0]);
    }
}
