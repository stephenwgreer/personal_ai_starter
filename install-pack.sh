#!/bin/bash
#
# Personal AI Starter — Pack Installer
#
# Usage:
#   ./install-pack.sh <pack-name>     Install a pack
#   ./install-pack.sh --list          List available packs
#   ./install-pack.sh --installed     Show installed packs
#
# Packs add skills, commands, and infrastructure to your AI system.
# They copy files into the right directories and update CLAUDE.md routing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKS_DIR="$SCRIPT_DIR/packs"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${BOLD}Personal AI Starter${NC} — Pack Installer"
    echo -e "${DIM}────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "  ${CYAN}→${NC} $1"
}

print_warn() {
    echo -e "  ${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
}

# ── Verify project ────────────────────────────────────────

verify_project() {
    if [ ! -f "$PROJECT_ROOT/CLAUDE.md" ]; then
        print_error "CLAUDE.md not found in $PROJECT_ROOT"
        print_error "Run this script from the project root directory."
        exit 1
    fi
}

# ── List packs ────────────────────────────────────────────

list_packs() {
    print_header
    echo ""
    echo -e "${BOLD}Available Packs${NC}"
    echo ""

    # Skills
    echo -e "  ${BOLD}Skills${NC} ${DIM}(add domain capabilities)${NC}"
    for pack_dir in "$PACKS_DIR"/*/; do
        local manifest="$pack_dir/pack.json"
        [ -f "$manifest" ] || continue
        local type=$(jq -r '.type' "$manifest")
        [ "$type" = "skill" ] || continue
        local name=$(jq -r '.name' "$manifest")
        local desc=$(jq -r '.description' "$manifest")
        echo -e "    ${CYAN}$name${NC}  ${DIM}— $desc${NC}"
    done

    echo ""
    echo -e "  ${BOLD}Commands${NC} ${DIM}(add slash commands)${NC}"
    for pack_dir in "$PACKS_DIR"/*/; do
        local manifest="$pack_dir/pack.json"
        [ -f "$manifest" ] || continue
        local type=$(jq -r '.type' "$manifest")
        [ "$type" = "command" ] || continue
        local name=$(jq -r '.name' "$manifest")
        local desc=$(jq -r '.description' "$manifest")
        echo -e "    ${CYAN}$name${NC}  ${DIM}— $desc${NC}"
    done

    echo ""
    echo -e "  ${BOLD}Infrastructure${NC} ${DIM}(add system capabilities)${NC}"
    for pack_dir in "$PACKS_DIR"/*/; do
        local manifest="$pack_dir/pack.json"
        [ -f "$manifest" ] || continue
        local type=$(jq -r '.type' "$manifest")
        [ "$type" = "infrastructure" ] || continue
        local name=$(jq -r '.name' "$manifest")
        local desc=$(jq -r '.description' "$manifest")
        echo -e "    ${CYAN}$name${NC}  ${DIM}— $desc${NC}"
    done

    echo ""
    echo -e "  ${DIM}Install with: ./install-pack.sh <pack-name>${NC}"
    echo ""
}

# ── Show installed ────────────────────────────────────────

show_installed() {
    verify_project

    print_header
    echo ""
    echo -e "${BOLD}Installed Packs${NC}"
    echo ""

    local found=0
    for pack_dir in "$PACKS_DIR"/*/; do
        local manifest="$pack_dir/pack.json"
        [ -f "$manifest" ] || continue
        local name=$(jq -r '.name' "$manifest")
        local first_file=$(jq -r '.files[0]' "$manifest")

        if [ -f "$PROJECT_ROOT/.claude/$first_file" ]; then
            local type=$(jq -r '.type' "$manifest")
            echo -e "  ${GREEN}●${NC} ${BOLD}$name${NC} ${DIM}($type)${NC}"
            found=1
        fi
    done

    if [ "$found" = "0" ]; then
        echo -e "  ${DIM}No packs installed yet.${NC}"
    fi

    echo ""
}

# ── Install a pack ────────────────────────────────────────

install_pack() {
    local pack_name="$1"
    local pack_dir="$PACKS_DIR/$pack_name"
    local manifest="$pack_dir/pack.json"

    # Validate
    if [ ! -d "$pack_dir" ]; then
        print_error "Pack '$pack_name' not found."
        echo ""
        echo -e "  ${DIM}Run ./install-pack.sh --list to see available packs.${NC}"
        exit 1
    fi

    if [ ! -f "$manifest" ]; then
        print_error "Pack '$pack_name' is missing pack.json"
        exit 1
    fi

    verify_project
    local claude_dir="$PROJECT_ROOT/.claude"
    local name=$(jq -r '.name' "$manifest")
    local type=$(jq -r '.type' "$manifest")
    local desc=$(jq -r '.description' "$manifest")
    local post_install=$(jq -r '.postInstall // empty' "$manifest")

    print_header
    echo ""
    echo -e "  Installing ${BOLD}$name${NC} ${DIM}($type)${NC}"
    echo -e "  ${DIM}$desc${NC}"
    echo ""

    # Check if already installed
    local first_file=$(jq -r '.files[0]' "$manifest")
    if [ -f "$claude_dir/$first_file" ]; then
        print_warn "Pack '$name' appears to already be installed."
        read -p "  Overwrite? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "  ${DIM}Skipped.${NC}"
            exit 0
        fi
    fi

    # Create directories
    local dirs=$(jq -r '.directories[]? // empty' "$manifest")
    if [ -n "$dirs" ]; then
        while IFS= read -r dir; do
            mkdir -p "$claude_dir/$dir"
            print_success "Created .claude/$dir/"
        done <<< "$dirs"
    fi

    # Copy files
    local files=$(jq -r '.files[]' "$manifest")
    while IFS= read -r file; do
        local src="$pack_dir/$file"
        local dest="$claude_dir/$file"
        local dest_dir=$(dirname "$dest")

        mkdir -p "$dest_dir"
        cp "$src" "$dest"
        print_success "Installed .claude/$file"
    done <<< "$files"

    # Update CLAUDE.md routing (for skill packs)
    local route_trigger=$(jq -r '.route.trigger // empty' "$manifest")
    local route_target=$(jq -r '.route.target // empty' "$manifest")

    if [ -n "$route_trigger" ] && [ -n "$route_target" ]; then
        local claude_md="$PROJECT_ROOT/CLAUDE.md"
        if [ -f "$claude_md" ]; then
            # Check if route already exists
            if grep -q "| .* | \`$route_target\` |" "$claude_md" 2>/dev/null; then
                print_info "Route for '$route_target' already in CLAUDE.md"
            else
                # Insert before "Everything else" line, or append to routing table
                if grep -q "Everything else" "$claude_md"; then
                    sed -i "/Everything else/i | $route_trigger | \`$route_target\` |" "$claude_md"
                    print_success "Added routing: $route_trigger → $route_target"
                else
                    print_warn "Could not find routing table in CLAUDE.md — add manually:"
                    echo -e "    ${DIM}| $route_trigger | \`$route_target\` |${NC}"
                fi
            fi
        fi
    fi

    # Post-install message
    echo ""
    if [ -n "$post_install" ]; then
        echo -e "  ${BOLD}Next steps:${NC}"
        echo -e "  ${post_install}"
    fi

    echo ""
    echo -e "  ${GREEN}Done.${NC} Pack '${BOLD}$name${NC}' installed."
    echo ""
}

# ── Main ──────────────────────────────────────────────────

case "${1:-}" in
    --list|-l)
        list_packs
        ;;
    --installed|-i)
        show_installed
        ;;
    --help|-h|"")
        print_header
        echo ""
        echo -e "  ${BOLD}Usage:${NC}"
        echo -e "    ./install-pack.sh ${CYAN}<pack-name>${NC}       Install a pack"
        echo -e "    ./install-pack.sh ${CYAN}--list${NC}            List available packs"
        echo -e "    ./install-pack.sh ${CYAN}--installed${NC}       Show installed packs"
        echo ""
        echo -e "  ${BOLD}Examples:${NC}"
        echo -e "    ./install-pack.sh career"
        echo -e "    ./install-pack.sh boardroom"
        echo -e "    ./install-pack.sh automation"
        echo ""
        ;;
    *)
        install_pack "$1"
        ;;
esac
