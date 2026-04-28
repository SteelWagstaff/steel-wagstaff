# Script to update monthly playlists with correct dates and tags

$musicDir = "src/content/music/en"
$monthMap = @{
    'january' = 1; 'february' = 2; 'march' = 3; 'april' = 4; 'may' = 5; 'june' = 6
    'july' = 7; 'august' = 8; 'september' = 9; 'october' = 10; 'november' = 11; 'december' = 12
}

function Get-NextMonthDate {
    param([int]$month, [int]$year)
    
    if ($month -eq 12) {
        return (Get-Date -Year ($year + 1) -Month 1 -Day 1).ToString('yyyy-MM-dd')
    } else {
        return (Get-Date -Year $year -Month ($month + 1) -Day 1).ToString('yyyy-MM-dd')
    }
}

function Extract-DateFromFilename {
    param([string]$filename)
    
    # Remove .md extension
    $name = $filename -replace '\.md$', ''
    
    # Extract year (always at the end)
    if ($name -match '(\d{4})$') {
        $year = [int]$Matches[1]
    } else {
        return $null
    }
    
    # Try to find month patterns - look for last month mentioned if multiple
    $monthPattern = 'january|february|march|april|may|june|july|august|september|october|november|december'
    $matches = [regex]::Matches($name, $monthPattern, 'IgnoreCase')
    
    if ($matches.Count -gt 0) {
        $lastMonth = $matches[$matches.Count - 1].Value.ToLower()
        $endMonthNum = $monthMap[$lastMonth]
        return Get-NextMonthDate -month $endMonthNum -year $year
    }
    
    return $null
}

$files = Get-ChildItem "$musicDir/*.md" | Where-Object {
    $_.Name -match '^\d+-songs-.*\d{4}\.md$'
}

$count = 0
foreach ($file in $files) {
    $newDate = Extract-DateFromFilename -filename $file.Name
    
    if ($newDate) {
        $content = Get-Content $file.FullName -Raw
        
        # Update publishedAt date
        $content = $content -replace 'publishedAt: \d{4}-\d{2}-\d{2}', "publishedAt: $newDate"
        
        # Update tags line
        if ($content -match 'tags:\s*\[(.*?)\]') {
            $existingTags = $Matches[1]
            
            # Remove old tags (mixtape, y20XX) and build new list
            $tagsArray = @()
            $tagsArray += '"monthly playlist"'
            
            # Parse existing tags and keep ones that aren't "mixtape" or "y20XX"
            $tagList = $existingTags -split ',\s*' | ForEach-Object { $_.Trim() }
            foreach ($tag in $tagList) {
                if ($tag -notmatch '^"(?:mixtape|y\d{4})"$') {
                    if ($tag -and $tag -ne '""') {
                        $tagsArray += $tag
                    }
                }
            }
            
            # Remove duplicates
            $tagsArray = $tagsArray | Select-Object -Unique
            $newTagsStr = $tagsArray -join ', '
            
            $content = $content -replace 'tags:\s*\[.*?\]', "tags: [$newTagsStr]"
        }
        
        Set-Content $file.FullName $content -NoNewline
        $count++
        Write-Host "Updated: $($file.Name) -> $newDate"
    }
}

Write-Host "Total files updated: $count"
