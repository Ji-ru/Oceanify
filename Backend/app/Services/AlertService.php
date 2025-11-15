<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AlertService
{
    protected $url;
    protected $key;
    protected $table = 'alerts';

    public function __construct()
    {
        $this->url = env('SUPABASE_URL') . '/rest/v1/';
        $this->key = env('SUPABASE_KEY');
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

    public function getAll($orderBy = 'time', $ascending = false)
    {
        $order = $ascending ? 'asc' : 'desc';
        $url = "{$this->url}{$this->table}?order={$orderBy}.{$order}";
        
        $response = $this->client()->get($url);
        
        if ($response->failed()) {
            Log::error('Supabase getAll failed for alerts', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            return ['error' => 'Failed to fetch alerts'];
        }
        
        return $response->json();
    }

    public function insert($data)
    {
        Log::info('🔵 AlertService insert called', ['data' => $data]);
        
        // Make sure we're returning the representation
        $response = $this->client()
            ->post($this->url . $this->table, $data);

        Log::info('🔵 Supabase response', [
            'status' => $response->status(),
            'body' => $response->body(),
            'successful' => $response->successful()
        ]);

        if (!$response->successful()) {
            Log::error('Supabase Insert Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'data' => $data
            ]);
        }

        // Return the array directly - Supabase returns array with Prefer header
        return $response->json();
    }

    public function update($id, $data)
    {
        $response = $this->client()
            ->patch($this->url . $this->table . "?id=eq.$id", $data);
        
        if (!$response->successful()) {
            Log::error('Supabase Update Failed for alerts', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        }
        
        // Return the array directly
        return $response->json();
    }

    public function delete($id)
    {
        $response = $this->client()
            ->delete($this->url . $this->table . "?id=eq.$id");
        
        if (!$response->successful()) {
            Log::error('Supabase Delete Failed for alerts', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        }
        
        return $response->json();
    }
}