#!/usr/bin/env bash
###############################################################################
# setup-cron.sh
#
# Automate cron job registration for PostgreSQL backup and retention cleanup.
# Supports both Unix/Linux environments and Windows Git Bash.
#
# Usage:
#   bash setup-cron.sh --dry-run              Show cron entries without installing
#   bash setup-cron.sh --install              Install cron jobs
#   bash setup-cron.sh --uninstall            Remove cron jobs
#
# Environment Variables:
#   PROJECT_ROOT     Default: current working directory
#   RETENTION_DAYS   Default: 7 (only used for display/documentation)
#   LOG_DIR          Default: backups/postgresql
#
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config
PROJECT_ROOT="${PROJECT_ROOT:-.}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
LOG_DIR="${LOG_DIR:-backups/postgresql}"
CRON_LOG="${LOG_DIR}/cron.log"
RETENTION_LOG="${LOG_DIR}/retention.log"

# Cron job identifiers
CRON_MARKER="# movie-hub-postgresql-backup"
BACKUP_JOBS=("backup-booking" "backup-cinema" "backup-movie" "backup-user")
BACKUP_SCHEDULE=("0 1" "15 1" "30 1" "45 1")  # Times for each service
RETENTION_SCHEDULE="0 3"  # 3 AM for cleanup

# Detect OS
is_windows() {
  [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]
}

is_linux() {
  [[ "$OSTYPE" == "linux-gnu"* ]]
}

# Helper to generate cron entry based on environment
generate_cron_entry() {
  local script_name="$1"
  local schedule="$2"
  
  if is_windows; then
    echo "${schedule} * * * /c/Program\\ Files/Git/bin/bash.exe ${PROJECT_ROOT}/scripts/postgresql-backup-restore/${script_name}.sh >> ${CRON_LOG} 2>&1 ${CRON_MARKER}"
  else
    echo "${schedule} * * * cd ${PROJECT_ROOT} && bash scripts/postgresql-backup-restore/${script_name}.sh >> ${CRON_LOG} 2>&1 ${CRON_MARKER}"
  fi
}

# Helper to generate cleanup cron entry
generate_cleanup_cron_entry() {
  if is_windows; then
    echo "${RETENTION_SCHEDULE} * * * /c/Program\\ Files/Git/bin/bash.exe ${PROJECT_ROOT}/scripts/postgresql-backup-restore/backup-retention-cleanup.sh >> ${RETENTION_LOG} 2>&1 ${CRON_MARKER}"
  else
    echo "${RETENTION_SCHEDULE} * * * cd ${PROJECT_ROOT} && bash scripts/postgresql-backup-restore/backup-retention-cleanup.sh >> ${RETENTION_LOG} 2>&1 ${CRON_MARKER}"
  fi
}

# Display dry-run information
show_dry_run() {
  echo -e "${YELLOW}=== DRY RUN: Cron entries to be installed ===${NC}"
  echo ""
  echo -e "${GREEN}Backup Jobs:${NC}"
  for i in "${!BACKUP_JOBS[@]}"; do
    echo ""
    echo "$(generate_cron_entry "${BACKUP_JOBS[$i]}" "${BACKUP_SCHEDULE[$i]}")"
  done
  echo ""
  echo -e "${GREEN}Retention Cleanup Job:${NC}"
  echo ""
  echo "$(generate_cleanup_cron_entry)"
  echo ""
  echo -e "${YELLOW}=== Environment ===${NC}"
  echo "OS: $(uname -s 2>/dev/null || echo 'Unknown')"
  echo "Project Root: ${PROJECT_ROOT}"
  echo "Retention Days: ${RETENTION_DAYS}"
  echo "Log Directory: ${LOG_DIR}"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  if is_windows; then
    echo "1. On Windows, cron jobs typically use Task Scheduler"
    echo "2. Run with --install-windows to set up using PowerShell Task Scheduler"
    echo "3. Or manually import the entries above into your cron daemon"
  else
    echo "1. Review the entries above"
    echo "2. Run: bash setup-cron.sh --install"
  fi
}

# Install cron jobs (Unix/Linux only)
install_cron() {
  if is_windows; then
    echo -e "${RED}Error: Windows does not have crontab. Use Task Scheduler instead.${NC}"
    echo ""
    echo "Steps:"
    echo "1. Run: bash scripts/postgresql-backup-restore/setup-cron.sh --dry-run"
    echo "2. Copy the cron entries displayed"
    echo "3. Use Windows Task Scheduler to create scheduled tasks"
    echo ""
    echo "Alternative: Run from Linux/container where crontab is available"
    return 1
  fi
  
  if ! command -v crontab &>/dev/null; then
    echo -e "${RED}Error: crontab command not found${NC}"
    return 1
  fi
  
  # Ensure log directory exists
  mkdir -p "${LOG_DIR}"
  
  # Build new crontab content
  local new_crontab
  new_crontab=$(crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" || true)
  
  # Add backup jobs
  for i in "${!BACKUP_JOBS[@]}"; do
    new_crontab+=$'\n'
    new_crontab+="$(generate_cron_entry "${BACKUP_JOBS[$i]}" "${BACKUP_SCHEDULE[$i]}")"
  done
  
  # Add cleanup job
  new_crontab+=$'\n'
  new_crontab+="$(generate_cleanup_cron_entry)"
  
  # Install new crontab
  echo "${new_crontab}" | crontab -
  
  echo -e "${GREEN}✓ Cron jobs installed successfully${NC}"
  echo ""
  echo "Installed jobs:"
  crontab -l | grep "${CRON_MARKER}"
}

# Uninstall cron jobs
uninstall_cron() {
  if is_windows; then
    echo -e "${RED}Error: Windows uses Task Scheduler, not crontab.${NC}"
    echo "Please remove jobs manually from Task Scheduler"
    return 1
  fi
  
  if ! command -v crontab &>/dev/null; then
    echo -e "${RED}Error: crontab command not found${NC}"
    return 1
  fi
  
  # Remove all movie-hub-postgresql-backup entries
  local new_crontab
  new_crontab=$(crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" || true)
  
  if [ -z "${new_crontab}" ]; then
    crontab -r 2>/dev/null || true
  else
    echo "${new_crontab}" | crontab -
  fi
  
  echo -e "${GREEN}✓ Cron jobs removed${NC}"
}

# Main logic
main() {
  local mode="${1:-}"
  
  case "${mode}" in
    --dry-run)
      show_dry_run
      ;;
    --install)
      install_cron
      ;;
    --uninstall)
      uninstall_cron
      ;;
    --help|-h)
      cat <<EOF
Usage: bash setup-cron.sh [COMMAND]

Commands:
  --dry-run       Show cron entries without installing
  --install       Install cron jobs (Unix/Linux only)
  --uninstall     Remove cron jobs (Unix/Linux only)
  --help          Show this help message

Environment Variables:
  PROJECT_ROOT    Project root directory (default: current directory)
  RETENTION_DAYS  Retention window in days (default: 7)
  LOG_DIR         Log directory (default: backups/postgresql)

Examples:
  bash setup-cron.sh --dry-run
  PROJECT_ROOT=/opt/movie-hub bash setup-cron.sh --install
  bash setup-cron.sh --uninstall

Notes:
  - On Windows: use --dry-run to see entries, then create tasks in Task Scheduler
  - On Linux/container: use --install to automatically register with crontab
  - Cron job markers are added to prevent duplicate entries
  - See scripts/postgresql-backup-restore/README.md for Windows Task Scheduler setup
EOF
      ;;
    *)
      echo -e "${RED}Error: Unknown command '${mode}'${NC}"
      echo "Use 'bash setup-cron.sh --help' for usage information"
      return 1
      ;;
  esac
}

main "$@"
