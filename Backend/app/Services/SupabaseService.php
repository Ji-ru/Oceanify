<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use \Illuminate\Http\Client\PendingRequest;

class SupabaseService
{
    protected $url;
    protected $key;
    protected $table;

    public function __construct()
    {
        $this->url = env('SUPABASE_URL') . '/rest/v1/';
        $this->key = env('SUPABASE_KEY');
        $this->table = env('SUPABASE_TABLE', 'profiles');

        // Log for debugging
        Log::info('Supabase Service Initialized', [
            'url' => $this->url,
            'table' => $this->table
        ]);
    }

    private function client()
    {
        return Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => "Bearer {$this->key}",
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ]);
    }

    // CREATE
    public function insert($data)
    {
        $response = $this->client()
            ->post($this->url . $this->table, $data);

        if (!$response->successful()) {
            Log::error('Supabase Insert Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'data' => $data
            ]);
        }

        return $response->json();
    }

    // READ
    public function getAll($orderBy = 'id', $ascending = true)
    {
        $order = $ascending ? 'asc' : 'desc';
        $url = "{$this->url}{$this->table}?order={$orderBy}.{$order}";

        $response = $this->client()->get($url);

        if ($response->failed()) {
            info('⚠️ Supabase getAll failed');
            info('Status: ' . $response->status());
            info('URL: ' . $url);
            info('Response: ' . $response->body());

            return ['error' => 'Failed to fetch data', 'status' => $response->status()];
        }

        info('✅ Supabase fetch successful for: ' . $url);
        return $response->json();
    }

    // UPDATE
    public function update($id, $data)
    {
        $response = $this->client()
            ->patch($this->url . $this->table . "?id=eq.$id", $data);

        if (!$response->successful()) {
            Log::error('Supabase Update Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'id' => $id,
                'data' => $data
            ]);
        }

        return $response->json();
    }

    // DELETE
    public function delete($id)
    {
        $response = $this->client()
            ->delete($this->url . $this->table . "?id=eq.$id");

        if (!$response->successful()) {
            Log::error('Supabase Delete Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'id' => $id
            ]);
        }

        return $response->json();
    }
}
