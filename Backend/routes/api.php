<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\ActivityLogController;

// ACCOUNTS
Route::get('/accounts', [AccountController::class, 'index']);
Route::post('/accounts', [AccountController::class, 'store']);
Route::put('/accounts/{id}', [AccountController::class, 'update']);
Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

// ALERTS
Route::apiResource('alerts', AlertController::class);

// ACTIVITY LOGS
Route::get('/activity-logs', [ActivityLogController::class, 'index']);