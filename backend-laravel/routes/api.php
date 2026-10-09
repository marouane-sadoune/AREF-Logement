<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EvictionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - AREF Oriental Housing Management System (Note 40)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // إدارة طلبات الإسناد (Assignments)
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments', [AssignmentController::class, 'store']);
    Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
    Route::patch('/assignments/{id}/status', [AssignmentController::class, 'updateStatus']);

    // توليد الوثائق الرسمية والطباعة (PDF Generation)
    Route::get('/assignments/{id}/documents/approval-letter', [DocumentController::class, 'generateApprovalLetter']);
    Route::get('/assignments/{id}/documents/pv-possession', [DocumentController::class, 'generatePvPossession']);

    // رفع وتفقد الوثائق الست الإلزامية المكونة لملف الطلب (Dossier de Demande)
    Route::post('/assignments/{id}/documents/{docKey}', [DocumentController::class, 'uploadSupportingDocument']);
    Route::get('/assignments/{id}/documents/{docKey}', [DocumentController::class, 'downloadSupportingDocument']);

    // مساطر إفراغ المساكن الإدارية والوظيفية (المحور 4 من المذكرة 40)
    Route::get('/evictions', [EvictionController::class, 'index']);
    Route::post('/evictions', [EvictionController::class, 'store']);
    Route::patch('/evictions/{id}', [EvictionController::class, 'update']);
    Route::delete('/evictions/{id}', [EvictionController::class, 'destroy']);

});
