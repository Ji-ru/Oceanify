<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\SupabaseService;

class AlertController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $alerts = Alert::orderBy('time', 'desc')->get();
            return response()->json($alerts);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch alerts'], 500);
        }
    }


    /**
     * Store a newly created resource in storage.
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

            $alert = Alert::create($validated);

            return response()->json($alert, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create alert'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Alert $alert): JsonResponse
    {
        return response()->json($alert);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Alert $alert): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'message' => 'sometimes|required|string',
                'type' => 'sometimes|required|string|in:auto,custom',
                'time' => 'sometimes|required|date',
            ]);

            $alert->update($validated);

            return response()->json($alert);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update alert'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Alert $alert): JsonResponse
    {
        try {
            $alert->delete();
            return response()->json(['message' => 'Alert deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete alert'], 500);
        }
    }
}
