import os
import platform
import json
from pathlib import Path
from typing import List, Dict, Any

class SourceDetector:
    """
    Module responsible for detecting available external backup sources.
    It does NOT decide which one to use, it just lists them.
    """

    def __init__(self):
        self.detectable_paths = self._get_default_search_paths()

    def _get_default_search_paths(self) -> List[Path]:
        """
        Define where to look for backups.
        In a real scenario, this would scan mount points.
        For now, we include a simulation folder and common USB drive letters on Windows.
        """
        paths = []

        # 1. Simulation/Test folder in project root
        project_root = Path(os.getcwd())
        paths.append(project_root / "external_backups_test")

        # 2. Windows Drive Letters (D: through Z:)
        # CAUTION: This is a simple heuristic for Windows.
        if platform.system() == "Windows":
            import string
            from ctypes import windll

            drives = []
            bitmask = windll.kernel32.GetLogicalDrives()
            for letter in string.ascii_uppercase:
                if bitmask & 1:
                    drives.append(letter)
                bitmask >>= 1

            # Filter out C: (System) and usually fixed drives if possible,
            # but for now we just look for specific signature folders
            for drive in drives:
                if drive != "C":
                    paths.append(Path(f"{drive}:/"))
                    paths.append(Path(f"{drive}:/Backups"))
                    paths.append(Path(f"{drive}:/LaikaBackups"))

        return paths

    def scan_sources(self) -> List[Dict[str, Any]]:
        """
        Scan all configured paths for valid backup sources.
        A valid source is a directory containing at least one .sql file
        OR a metadata.json file indicative of a Laika backup.
        """
        found_sources = []

        for path in self.detectable_paths:
            if not path.exists():
                continue

            try:
                # Check for SQL files or JSON metadata
                # We limit depth to avoiding deep scanning entire drives
                has_backups = False
                backup_files = []

                # Simple check: does it have any .sql files?
                for file in path.glob("*.sql"):
                    has_backups = True
                    backup_files.append(file.name)
                    if len(backup_files) > 5: break # Don't list too many

                if has_backups:
                    source_id = f"src_{abs(hash(str(path)))}"
                    source_type = "usb" if str(path)[1] == ":" else "local_folder"

                    found_sources.append({
                        "id": source_id,
                        "type": source_type,
                        "path": str(path),
                        "label": f"Drive {str(path)[:2]}" if source_type == "usb" else path.name,
                        "preview_files": backup_files
                    })

            except Exception as e:
                print(f"Error scanning {path}: {e}")
                continue

        return found_sources
