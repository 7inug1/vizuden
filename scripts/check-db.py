"""Read-only database check; never prints credentials or report contents."""
import os
import sys
import urllib.error
import urllib.request


def main():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url.startswith("https://") or not key:
        print("Missing or invalid Supabase configuration.")
        return 1
    request = urllib.request.Request(
        url + "/rest/v1/reports?select=id&limit=1",
        method="HEAD",
        headers={"apikey": key, "Authorization": "Bearer " + key},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if not 200 <= response.status < 300:
                print("Database check failed.")
                return 1
    except urllib.error.HTTPError as error:
        print("Database check failed: HTTP", error.code)
        return 1
    except (urllib.error.URLError, TimeoutError, OSError):
        print("Database check failed: connection or timeout error.")
        return 1
    print("Database read succeeded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
