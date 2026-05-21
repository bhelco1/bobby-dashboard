#!/bin/sh
input=$(cat)

ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // empty')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
five_hour=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
seven_day=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

parts=""

if [ -n "$ctx_size" ]; then
  ctx_k=$(echo "$ctx_size" | awk '{printf "%dk", $1/1000}')
  if [ -n "$used_pct" ] && [ -n "$remaining_pct" ]; then
    parts="ctx:${ctx_k} used:$(printf '%.0f' "$used_pct")% rem:$(printf '%.0f' "$remaining_pct")%"
  else
    parts="ctx:${ctx_k}"
  fi
fi

if [ -n "$five_hour" ]; then
  five_str="5h:$(printf '%.0f' "$five_hour")%"
  parts="${parts:+$parts }$five_str"
fi

if [ -n "$seven_day" ]; then
  week_str="7d:$(printf '%.0f' "$seven_day")%"
  parts="${parts:+$parts }$week_str"
fi

[ -n "$parts" ] && printf '%s' "$parts"
