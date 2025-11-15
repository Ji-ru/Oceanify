<?php

namespace App\Http\Controllers;

use App\Services\AlertService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Helpers\ActivityLogger;

class AlertController extends Controller
{
    protected $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Display a listing of alerts.
     */
    public function index(): JsonResponse
    {
        try {
            $alerts = $this->alertService->getAll('time', false);
            return response()->json($alerts);
        } catch (\Exception $e) {
            Log::error('Error fetching alerts: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch alerts'], 500);
        }
    }

    /**
     * Store a newly created alert.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|string|in:auto,custom',
                'time' => 'required|date',
            ]);

            // Create the alert
            $result = $this->alertService->insert($validated);

            Log::info('Creating activity log for alert creation', [
                'result' => $result
            ]);

            // Get user info from request headers
            $userId = $request->header('X-User-Id');
            $userEmail = $request->header('X-User-Email');

            // Log the activity
            $alertDetails = "Title: {$validated['title']}, Type: {$validated['type']}";
            $logResult = ActivityLogger::log(
                'Created alert',
                $alertDetails,
                $userId,
                $userEmail
            );

            Log::info('Activity log response (create alert):', [
                'logResult' => $logResult
            ]);

            return response()->json($result, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating alert: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create alert'], 500);
        }
    }

    /**
     * Display the specified alert.
     */
    public function show($id): JsonResponse
    {
        try {
            $alerts = $this->alertService->getAll();
            $alert = collect($alerts)->firstWhere('id', $id);
            
            if (!$alert) {
                return response()->json(['error' => 'Alert not found'], 404);
            }
            
            return response()->json($alert);
        } catch (\Exception $e) {
            Log::error('Error fetching alert: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch alert'], 500);
        }
    }

    /**
     * Update the specified alert.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'message' => 'sometimes|required|string',
                'type' => 'sometimes|required|string|in:auto,custom',
                'time' => 'sometimes|required|date',
            ]);

            // Update the alert
            $result = $this->alertService->update($id, $validated);

            Log::info('Creating activity log for alert update', [
                'id' => $id,
                'updates' => $validated
            ]);

            // Get user info from request headers
            $userId = $request->header('X-User-Id');
            $userEmail = $request->header('X-User-Email');

            // Log the activity
            $alertDetails = "Alert ID: {$id}";
            if (isset($validated['title'])) {
                $alertDetails .= ", Title: {$validated['title']}";
            }
            
            $logResult = ActivityLogger::log(
                'Updated alert',
                $alertDetails,
                $userId,
                $userEmail
            );

            Log::info('Activity log response (update alert):', [
                'logResult' => $logResult
            ]);

            return response()->json($result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating alert: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update alert'], 500);
        }
    }

    /**
     * Remove the specified alert.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            // Delete the alert
            $this->alertService->delete($id);

            Log::info('Creating activity log for alert deletion', [
                'id' => $id
            ]);

            // Get user info from request headers
            $userId = $request->header('X-User-Id');
            $userEmail = $request->header('X-User-Email');

            // Log the activity
            $logResult = ActivityLogger::log(
                'Deleted alert',
                "Alert ID: {$id}",
                $userId,
                $userEmail
            );

            Log::info('Activity log response (delete alert):', [
                'logResult' => $logResult
            ]);

            return response()->json(['message' => 'Alert deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting alert: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete alert'], 500);
        }
    }
}