<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('filename')->unique();
            $table->string('alt')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('filesize')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();
        });

        Schema::create('skill_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('en_name');
            $table->string('id_id_name');
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'order']);
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->foreignId('category_id')->nullable()->constrained('skill_categories')->nullOnDelete();
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'order']);
        });

        Schema::create('focus_areas', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('en_title');
            $table->string('id_id_title');
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'order']);
        });

        Schema::create('experience', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('en_position');
            $table->string('en_organization');
            $table->string('en_period');
            $table->text('en_description');
            $table->string('id_id_position');
            $table->string('id_id_organization');
            $table->string('id_id_period');
            $table->text('id_id_description');
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'order']);
        });

        Schema::create('experience_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experience_id')->constrained('experience')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->integer('order')->default(0);

            $table->index(['experience_id', 'order']);
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('en_title');
            $table->string('en_issuer');
            $table->text('en_description')->nullable();
            $table->string('id_id_title');
            $table->string('id_id_issuer');
            $table->text('id_id_description')->nullable();
            $table->string('year')->nullable();
            $table->string('credential_id')->nullable();
            $table->string('credential_url')->nullable();
            $table->foreignId('file_id')->nullable()->constrained('media')->nullOnDelete();
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'order']);
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('slug')->unique();
            $table->string('en_title');
            $table->string('en_kind');
            $table->text('en_summary');
            $table->text('en_description')->nullable();
            $table->string('id_id_title');
            $table->string('id_id_kind');
            $table->text('id_id_summary');
            $table->text('id_id_description')->nullable();
            $table->string('year')->nullable();
            $table->foreignId('image_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('visual')->default('orders');
            $table->string('live_url')->nullable();
            $table->string('github_url')->nullable();
            $table->boolean('selected')->default(false);
            $table->boolean('published')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['published', 'selected', 'order']);
            $table->index(['published', 'order']);
        });

        Schema::create('project_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->integer('order')->default(0);

            $table->index(['project_id', 'order']);
        });

        Schema::create('project_gallery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->integer('order')->default(0);

            $table->index(['project_id', 'order']);
        });

        Schema::create('about_settings', function (Blueprint $table) {
            $table->id();
            $table->string('en_header')->nullable();
            $table->string('en_heading')->nullable();
            $table->text('en_lead')->nullable();
            $table->text('en_body_primary')->nullable();
            $table->text('en_body_secondary')->nullable();
            $table->string('en_profile_heading')->nullable();
            $table->json('en_info_rows')->nullable();
            $table->string('id_id_header')->nullable();
            $table->string('id_id_heading')->nullable();
            $table->text('id_id_lead')->nullable();
            $table->text('id_id_body_primary')->nullable();
            $table->text('id_id_body_secondary')->nullable();
            $table->string('id_id_profile_heading')->nullable();
            $table->json('id_id_info_rows')->nullable();
            $table->timestamps();
        });

        Schema::create('contact_settings', function (Blueprint $table) {
            $table->id();
            $table->string('email')->nullable();
            $table->string('en_base_location')->nullable();
            $table->string('id_id_base_location')->nullable();
            $table->json('en_contact_rows')->nullable();
            $table->json('id_id_contact_rows')->nullable();
            $table->json('social_links')->nullable();
            $table->timestamps();
        });

        Schema::create('resume_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('en_document_title')->default('Curriculum Vitae');
            $table->string('id_id_document_title')->default('Curriculum Vitae');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_settings');
        Schema::dropIfExists('contact_settings');
        Schema::dropIfExists('about_settings');
        Schema::dropIfExists('project_gallery');
        Schema::dropIfExists('project_skill');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('experience_skill');
        Schema::dropIfExists('experience');
        Schema::dropIfExists('focus_areas');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('skill_categories');
        Schema::dropIfExists('media');
    }
};
