<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Helpers\ActivityLogger;

class AccountController extends Controller {
    protected $supabase;

    public function __construct(SupabaseService $supabase) {
        $this->supabase = $supabase;
    }

    public function index() {
        $accounts = $this->supabase->getAll('id', true);
        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $result = $this->supabase->insert(
            $request->only(['first_name', 'last_name', 'email', 'role','status'])
        );

        Log::info('Creating activity log for account creation', [
            'result' => $result
        ]);

        // Get user info from request headers
        $userId = $request->header('X-User-Id');
        $userEmail = $request->header('X-User-Email');

        $logResult = ActivityLogger::log(
            'Created account', 
            json_encode($result),
            $userId,
            $userEmail
        );

        Log::info('Activity log response (create):', [
            'logResult' => $logResult
        ]);

        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $result = $this->supabase->update(
            $id,
            $request->only(['first_name', 'last_name', 'email', 'role','status'])
        );

        Log::info('Creating activity log for account update', [
            'id' => $id
        ]);

        // Get user info from request headers
        $userId = $request->header('X-User-Id');
        $userEmail = $request->header('X-User-Email');

        $logResult = ActivityLogger::log(
            'Updated account', 
            "Account ID: {$id}",
            $userId,
            $userEmail
        );
        
        Log::info('Activity log response (update):', ['logResult' => $logResult]);

        return response()->json($result);
    }

    public function destroy(Request $request, $id)
    {
        $url = env('SUPABASE_URL') . '/auth/v1/admin/users/' . $id;

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_KEY'),
            'Content-Type' => 'application/json',
        ])->delete($url);

        if ($response->successful()) {
            Log::info('Creating activity log for account deletion', [
                'id' => $id
            ]);

            // Get user info from request headers
            $userId = $request->header('X-User-Id');
            $userEmail = $request->header('X-User-Email');

            $logResult = ActivityLogger::log(
                'Deleted account', 
                "Account ID: {$id}",
                $userId,
                $userEmail
            );
            
            Log::info('Activity log response (delete):', [
                'logResult' => $logResult
            ]);

            return response()->json(['message' => 'User deleted successfully']);
        } else {
            Log::error('Failed to delete user', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json([
                'message' => 'Failed to delete user',
                'error' => $response->body()
            ], 500);
        }
    }
}