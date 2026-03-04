from pathlib import Path
from typing import Dict, Any, Optional
import json

class SourceSelector:
    """
    Module responsible for selecting and validating a specific backup source.
    """

    def validate_source(self, source_path: str) -> Dict[str, Any]:
        """
        Verify if a source path is valid and accessible.
        """
        path = Path(source_path)

        if not path.exists():
            return {"valid": False, "error": "Path does not exist"}

        if not path.is_dir():
             return {"valid": False, "error": "Path is not a directory"}

        # Check for write permissions (optional, but good for restoring)
        # Check for read permissions
        try:
             # Try listing files
             files = list(path.glob("*"))
             return {"valid": True, "file_count": len(files)}
        except PermissionError:
             return {"valid": False, "error": "Permission denied"}
        except Exception as e:
             return {"valid": False, "error": str(e)}

    def get_backup_details(self, file_path: str) -> Dict[str, Any]:
        """
        Get details of a specific backup file.
        Start by looking for a companion .json metadata file.
        """
        path = Path(file_path)
        if not path.exists():
            return {"valid": False, "error": "File not found"}

        metadata_path = path.with_suffix(path.suffix + ".json")

        details = {
            "filename": path.name,
            "size_bytes": path.stat().st_size,
            "modified": path.stat().st_mtime
        }

        if metadata_path.exists():
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
                    details.update(meta)
            except Exception:
                pass # Ignore metadata errors, just return file info

        return details
