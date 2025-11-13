<?php
namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ActivityLogger {
    public static function log($action, $details = null, $userId = null, $userEmail = null) {
        Log::info('Attempting to insert activity log to Supabase', [
            'action' => $action,
            'details' => $details,
            'user_id' => $userId,
            'user_email' => $userEmail,
        ]);

        $url = env('SUPABASE_URL') . '/rest/v1/activity_logs';

        $performedBy = $userEmail ?: 'Guest';
        
        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_KEY'),
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ])->post($url, [
            'user_id' => $userId,
            'action' => $action,
            'details' => "$details (Performed by: $performedBy)",
        ]);

        Log::info('Supabase response', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return $response->json();
    }
}