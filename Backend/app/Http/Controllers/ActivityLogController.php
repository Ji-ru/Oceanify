<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Helpers\ActivityLogger;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $url = env('SUPABASE_URL') . '/rest/v1/activity_logs';
        
        // Add query parameters for sorting (newest first)
        $queryParams = [
            'select' => '*',
            'order' => 'created_at.desc'
        ];
        
        // Optional: Add pagination
        if ($request->has('limit')) {
            $queryParams['limit'] = $request->input('limit');
        }
        
        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_KEY'),
            'Content-Type' => 'application/json',
        ])->get($url, $queryParams);

        if ($response->successful()) {
            return response()->json($response->json());
        }

        Log::error('Failed to fetch activity logs', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);

        return response()->json([
            'message' => 'Failed to fetch activity logs',
            'error' => $response->body()
        ], 500);
    }
}