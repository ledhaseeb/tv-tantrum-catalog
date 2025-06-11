#!/bin/bash
# Create GitHub upload batches with strict 100-file limit
echo "Creating optimized GitHub batches..."

rm -rf /tmp/github-upload-batches
mkdir -p /tmp/github-upload-batches

# Batch 1: Essential Configuration (13 files)
mkdir -p /tmp/github-upload-batches/batch-1
cp package.json railway.toml Dockerfile .dockerignore README.md .gitignore /tmp/github-upload-batches/batch-1/
cp drizzle.config.ts vite.config.ts tailwind.config.ts tsconfig.json postcss.config.js /tmp/github-upload-batches/batch-1/
cp components.json data-migration-script.sql /tmp/github-upload-batches/batch-1/
echo "Batch 1: $(find /tmp/github-upload-batches/batch-1 -type f | wc -l) files"

# Batch 2: Server Backend (14 files)
mkdir -p /tmp/github-upload-batches/batch-2
cp -r server /tmp/github-upload-batches/batch-2/
echo "Batch 2: $(find /tmp/github-upload-batches/batch-2 -type f | wc -l) files"

# Batch 3: Shared + Client Core (23 files)
mkdir -p /tmp/github-upload-batches/batch-3
cp -r shared /tmp/github-upload-batches/batch-3/
mkdir -p /tmp/github-upload-batches/batch-3/client/src
cp client/index.html client/env.d.ts /tmp/github-upload-batches/batch-3/client/
cp client/src/main.tsx client/src/index.css /tmp/github-upload-batches/batch-3/client/src/
cp -r client/src/lib /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
cp -r client/src/assets /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
cp client/src/App*.tsx /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
echo "Batch 3: $(find /tmp/github-upload-batches/batch-3 -type f | wc -l) files"

# Batch 4: Client Components + Hooks (max 85 files, add some public)
mkdir -p /tmp/github-upload-batches/batch-4/client/src
cp -r client/src/components /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
cp -r client/src/hooks /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
cp -r client/src/pages /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
# Add a few essential public files
mkdir -p /tmp/github-upload-batches/batch-4/client/public
cp client/public/robots.txt /tmp/github-upload-batches/batch-4/client/public/ 2>/dev/null || true
echo "Batch 4: $(find /tmp/github-upload-batches/batch-4 -type f | wc -l) files"

# Split public assets into multiple batches (max 100 each)
public_files=$(find client/public -type f 2>/dev/null | head -400)
batch_num=5
file_count=0
current_batch_count=0

mkdir -p /tmp/github-upload-batches/batch-$batch_num/client/public

echo "$public_files" | while read file; do
    if [ -n "$file" ]; then
        rel_path=${file#client/public/}
        target_dir="/tmp/github-upload-batches/batch-$batch_num/client/public/$(dirname "$rel_path")"
        mkdir -p "$target_dir"
        cp "$file" "/tmp/github-upload-batches/batch-$batch_num/client/public/$rel_path"
        
        current_batch_count=$((current_batch_count + 1))
        
        # Check if we need a new batch
        if [ $current_batch_count -eq 100 ]; then
            echo "Batch $batch_num: $current_batch_count files"
            batch_num=$((batch_num + 1))
            mkdir -p /tmp/github-upload-batches/batch-$batch_num/client/public
            current_batch_count=0
        fi
    fi
done

# Final count for last batch
if [ $current_batch_count -gt 0 ]; then
    echo "Batch $batch_num: $current_batch_count files"
fi

echo ""
echo "All batches created in /tmp/github-upload-batches/"
for batch in /tmp/github-upload-batches/batch-*; do
    count=$(find "$batch" -type f | wc -l)
    batch_name=$(basename "$batch")
    echo "$batch_name: $count files"
done