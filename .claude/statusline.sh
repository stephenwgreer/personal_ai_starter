#!/bin/bash

# Status line for Claude Code — shows model, context usage, and session tokens.
# Reads JSON from stdin (provided by Claude Code).

JSON=$(cat)

MODEL=$(echo "$JSON" | jq -r '.model.display_name // "Claude"' | sed 's/Claude //')
CONTEXT_PCT=$(echo "$JSON" | jq -r '.context_window.used_percentage // 0')

SESSION_INPUT=$(echo "$JSON" | jq -r '.context_window.total_input_tokens // 0')
SESSION_OUTPUT=$(echo "$JSON" | jq -r '.context_window.total_output_tokens // 0')
SESSION_TOKENS=$((SESSION_INPUT + SESSION_OUTPUT))

# Color coding for context usage
if (( $(echo "$CONTEXT_PCT < 50" | bc -l) )); then
    CONTEXT_COLOR="\033[32m"  # Green
elif (( $(echo "$CONTEXT_PCT < 70" | bc -l) )); then
    CONTEXT_COLOR="\033[33m"  # Yellow
else
    CONTEXT_COLOR="\033[31m"  # Red
fi
RESET="\033[0m"

# Format tokens (K = thousands, M = millions)
format_tokens() {
    local tokens=$1
    if [ "$tokens" -ge 1000000 ]; then
        awk "BEGIN {printf \"%.1fM\", $tokens / 1000000}"
    elif [ "$tokens" -ge 1000 ]; then
        awk "BEGIN {printf \"%.0fK\", $tokens / 1000}"
    else
        echo "$tokens"
    fi
}

SESSION_DISPLAY=$(format_tokens $SESSION_TOKENS)
AI_NAME="${AI_NAME:-MyAI}"

echo -ne "${AI_NAME} | ${MODEL} | ${CONTEXT_COLOR}Ctx: ${CONTEXT_PCT}%${RESET} | Session: ${SESSION_DISPLAY}"
