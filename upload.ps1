# Video Converter → GitHub Upload
# ================================

$ProjectPath = "C:\Users\User\video-converter"
$GitRepo = "https://github.com/KodiniTools/Videokonverter.git"

Write-Host "`nUploading to GitHub..." -ForegroundColor Cyan

# Zum Projektordner
cd $ProjectPath

# Git init
git init

# Remote hinzufügen
git remote add origin $GitRepo 2>$null
git remote set-url origin $GitRepo

# Branch auf main
git branch -M main

# Alles hinzufügen
git add .

# Commit
git commit -m "Initial commit: Vue 3 Video Converter"

# Push
git push -u origin main --force

Write-Host "`n✓ Done!" -ForegroundColor Green
Write-Host "https://github.com/KodiniTools/Videokonverter`n" -ForegroundColor Blue
