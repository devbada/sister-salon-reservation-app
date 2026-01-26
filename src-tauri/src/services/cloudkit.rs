// CloudKit integration for iOS via Swift FFI
//
// Uses dlsym to find Swift functions at runtime to avoid link-time errors

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[cfg(target_os = "ios")]
use std::sync::OnceLock;

#[cfg(target_os = "ios")]
type InitFn = unsafe extern "C" fn();
#[cfg(target_os = "ios")]
type CheckAvailableFn = unsafe extern "C" fn() -> bool;
#[cfg(target_os = "ios")]
type UploadFn = unsafe extern "C" fn(*const c_char) -> bool;
#[cfg(target_os = "ios")]
type DeleteFn = unsafe extern "C" fn(*const c_char) -> bool;
#[cfg(target_os = "ios")]
type DownloadFn = unsafe extern "C" fn(*const c_char, *const c_char) -> bool;
#[cfg(target_os = "ios")]
type GetStringFn = unsafe extern "C" fn() -> *const c_char;

#[cfg(target_os = "ios")]
static CLOUDKIT_FUNCS: OnceLock<Option<CloudKitFunctions>> = OnceLock::new();

#[cfg(target_os = "ios")]
struct CloudKitFunctions {
    init: Option<InitFn>,
    check_available: CheckAvailableFn,
    upload: UploadFn,
    delete: Option<DeleteFn>,
    download: Option<DownloadFn>,
    list: Option<GetStringFn>,
    get_last_error: GetStringFn,
    get_last_record_id: GetStringFn,
}

#[cfg(target_os = "ios")]
unsafe impl Send for CloudKitFunctions {}
#[cfg(target_os = "ios")]
unsafe impl Sync for CloudKitFunctions {}

#[cfg(target_os = "ios")]
fn get_cloudkit_functions() -> Option<&'static CloudKitFunctions> {
    CLOUDKIT_FUNCS.get_or_init(|| {
        unsafe {
            println!("[CloudKit Rust] Loading CloudKit functions via dlsym...");

            // Try RTLD_DEFAULT first (current executable and all loaded libraries)
            let handle = libc::dlopen(std::ptr::null(), libc::RTLD_NOW);
            if handle.is_null() {
                let error = libc::dlerror();
                if !error.is_null() {
                    let err_str = CStr::from_ptr(error).to_string_lossy();
                    println!("[CloudKit Rust] dlopen failed: {}", err_str);
                } else {
                    println!("[CloudKit Rust] dlopen failed (no error details)");
                }
                return None;
            }

            println!("[CloudKit Rust] dlopen successful, looking up symbols...");

            // Look up init function (optional)
            let init_sym = libc::dlsym(handle, b"swift_cloudkit_init\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_init: {:?}", init_sym);

            let check_available = libc::dlsym(handle, b"swift_cloudkit_available\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_available: {:?}", check_available);

            let upload = libc::dlsym(handle, b"swift_cloudkit_upload\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_upload: {:?}", upload);

            let get_last_error = libc::dlsym(handle, b"swift_cloudkit_last_error\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_last_error: {:?}", get_last_error);

            let get_last_record_id = libc::dlsym(handle, b"swift_cloudkit_last_record_id\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_last_record_id: {:?}", get_last_record_id);

            let list_sym = libc::dlsym(handle, b"swift_cloudkit_list\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_list: {:?}", list_sym);

            let delete_sym = libc::dlsym(handle, b"swift_cloudkit_delete\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_delete: {:?}", delete_sym);

            let download_sym = libc::dlsym(handle, b"swift_cloudkit_download\0".as_ptr() as *const _);
            println!("[CloudKit Rust] swift_cloudkit_download: {:?}", download_sym);

            if check_available.is_null() || upload.is_null() {
                println!("[CloudKit Rust] ERROR: Required Swift functions not found!");
                println!("[CloudKit Rust] Make sure SalonCloudKit.swift is added to the Xcode project");

                // Check if there's a dlerror
                let error = libc::dlerror();
                if !error.is_null() {
                    let err_str = CStr::from_ptr(error).to_string_lossy();
                    println!("[CloudKit Rust] dlerror: {}", err_str);
                }

                return None;
            }

            println!("[CloudKit Rust] All required functions found!");

            let init_fn: Option<InitFn> = if !init_sym.is_null() {
                Some(std::mem::transmute(init_sym))
            } else {
                None
            };

            let list_fn: Option<GetStringFn> = if !list_sym.is_null() {
                Some(std::mem::transmute(list_sym))
            } else {
                None
            };

            let delete_fn: Option<DeleteFn> = if !delete_sym.is_null() {
                Some(std::mem::transmute(delete_sym))
            } else {
                None
            };

            let download_fn: Option<DownloadFn> = if !download_sym.is_null() {
                Some(std::mem::transmute(download_sym))
            } else {
                None
            };

            let funcs = CloudKitFunctions {
                init: init_fn,
                check_available: std::mem::transmute(check_available),
                upload: std::mem::transmute(upload),
                delete: delete_fn,
                download: download_fn,
                list: list_fn,
                get_last_error: std::mem::transmute(get_last_error),
                get_last_record_id: std::mem::transmute(get_last_record_id),
            };

            // Call init if available
            if let Some(init) = funcs.init {
                println!("[CloudKit Rust] Calling swift_cloudkit_init...");
                init();
                println!("[CloudKit Rust] swift_cloudkit_init completed");
            }

            Some(funcs)
        }
    }).as_ref()
}

/// Initialize CloudKit - call this at app startup
pub fn init_cloudkit() {
    #[cfg(target_os = "ios")]
    {
        println!("[CloudKit Rust] init_cloudkit called");
        let _ = get_cloudkit_functions();
    }
    #[cfg(not(target_os = "ios"))]
    {
        println!("[CloudKit Rust] init_cloudkit - not iOS, skipping");
    }
}

/// Check if CloudKit is available
pub fn is_cloudkit_available() -> bool {
    println!("[CloudKit Rust] is_cloudkit_available called");

    #[cfg(target_os = "ios")]
    {
        if let Some(funcs) = get_cloudkit_functions() {
            println!("[CloudKit Rust] Calling Swift check_available...");
            let result = unsafe { (funcs.check_available)() };
            println!("[CloudKit Rust] Swift returned: {}", result);
            return result;
        }
        println!("[CloudKit Rust] Functions not loaded, returning false");
        false
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let icloud_path = std::path::PathBuf::from(home)
                .join("Library")
                .join("Mobile Documents")
                .join("com~apple~CloudDocs");
            let exists = icloud_path.exists();
            println!("[CloudKit Rust] macOS iCloud path exists: {}", exists);
            return exists;
        }
        false
    }
    #[cfg(not(any(target_os = "ios", target_os = "macos")))]
    {
        println!("[CloudKit Rust] Not Apple platform, returning false");
        false
    }
}

/// Upload backup to CloudKit
pub fn upload_to_cloudkit(local_path: &str) -> Result<String, String> {
    println!("[CloudKit Rust] upload_to_cloudkit called: {}", local_path);

    #[cfg(target_os = "ios")]
    {
        let funcs = get_cloudkit_functions()
            .ok_or_else(|| {
                let err = "CloudKit 함수를 로드할 수 없습니다. Swift 파일이 프로젝트에 추가되었는지 확인하세요.".to_string();
                println!("[CloudKit Rust] Error: {}", err);
                err
            })?;

        let c_path = CString::new(local_path).map_err(|e| {
            let err = format!("Invalid path: {}", e);
            println!("[CloudKit Rust] Error: {}", err);
            err
        })?;

        println!("[CloudKit Rust] Calling Swift upload...");
        let success = unsafe { (funcs.upload)(c_path.as_ptr()) };
        println!("[CloudKit Rust] Swift upload returned: {}", success);

        if success {
            let record_id = unsafe {
                let ptr = (funcs.get_last_record_id)();
                if ptr.is_null() {
                    "unknown".to_string()
                } else {
                    CStr::from_ptr(ptr).to_string_lossy().to_string()
                }
            };
            println!("[CloudKit Rust] Upload successful: {}", record_id);
            Ok(record_id)
        } else {
            let error = unsafe {
                let ptr = (funcs.get_last_error)();
                if ptr.is_null() {
                    "알 수 없는 오류".to_string()
                } else {
                    CStr::from_ptr(ptr).to_string_lossy().to_string()
                }
            };
            println!("[CloudKit Rust] Upload failed: {}", error);
            Err(error)
        }
    }

    #[cfg(not(target_os = "ios"))]
    {
        let err = "CloudKit은 iOS에서만 사용할 수 있습니다.".to_string();
        println!("[CloudKit Rust] Error: {}", err);
        Err(err)
    }
}

/// List backups from CloudKit
/// Returns JSON string: [{"id":"...", "filename":"...", "size":123, "createdAt":"..."}]
pub fn list_cloudkit_backups() -> Result<String, String> {
    println!("[CloudKit Rust] list_cloudkit_backups called");

    #[cfg(target_os = "ios")]
    {
        let funcs = get_cloudkit_functions()
            .ok_or_else(|| "CloudKit 함수를 로드할 수 없습니다.".to_string())?;

        let list_fn = funcs.list.ok_or_else(|| "목록 함수를 찾을 수 없습니다.".to_string())?;

        let result = unsafe {
            let ptr = list_fn();
            if ptr.is_null() {
                "[]".to_string()
            } else {
                CStr::from_ptr(ptr).to_string_lossy().to_string()
            }
        };

        println!("[CloudKit Rust] list_cloudkit_backups result: {}", result);
        Ok(result)
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err("CloudKit은 iOS에서만 사용할 수 있습니다.".to_string())
    }
}

/// Delete a backup from CloudKit by record ID
pub fn delete_cloudkit_backup(record_id: &str) -> Result<(), String> {
    println!("[CloudKit Rust] delete_cloudkit_backup called: {}", record_id);

    #[cfg(target_os = "ios")]
    {
        let funcs = get_cloudkit_functions()
            .ok_or_else(|| "CloudKit 함수를 로드할 수 없습니다.".to_string())?;

        let delete_fn = funcs.delete.ok_or_else(|| "삭제 함수를 찾을 수 없습니다.".to_string())?;

        let c_record_id = CString::new(record_id).map_err(|e| format!("Invalid record ID: {}", e))?;

        let success = unsafe { delete_fn(c_record_id.as_ptr()) };

        if success {
            println!("[CloudKit Rust] Delete successful");
            Ok(())
        } else {
            let error = unsafe {
                let ptr = (funcs.get_last_error)();
                if ptr.is_null() {
                    "알 수 없는 오류".to_string()
                } else {
                    CStr::from_ptr(ptr).to_string_lossy().to_string()
                }
            };
            println!("[CloudKit Rust] Delete failed: {}", error);
            Err(error)
        }
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err("CloudKit은 iOS에서만 사용할 수 있습니다.".to_string())
    }
}

/// Download a backup from CloudKit by record ID to a local path
pub fn download_cloudkit_backup(record_id: &str, dest_path: &str) -> Result<(), String> {
    println!("[CloudKit Rust] download_cloudkit_backup called: {} -> {}", record_id, dest_path);

    #[cfg(target_os = "ios")]
    {
        let funcs = get_cloudkit_functions()
            .ok_or_else(|| "CloudKit 함수를 로드할 수 없습니다.".to_string())?;

        let download_fn = funcs.download.ok_or_else(|| "다운로드 함수를 찾을 수 없습니다.".to_string())?;

        let c_record_id = CString::new(record_id).map_err(|e| format!("Invalid record ID: {}", e))?;
        let c_dest_path = CString::new(dest_path).map_err(|e| format!("Invalid destination path: {}", e))?;

        let success = unsafe { download_fn(c_record_id.as_ptr(), c_dest_path.as_ptr()) };

        if success {
            println!("[CloudKit Rust] Download successful");
            Ok(())
        } else {
            let error = unsafe {
                let ptr = (funcs.get_last_error)();
                if ptr.is_null() {
                    "알 수 없는 오류".to_string()
                } else {
                    CStr::from_ptr(ptr).to_string_lossy().to_string()
                }
            };
            println!("[CloudKit Rust] Download failed: {}", error);
            Err(error)
        }
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err("CloudKit은 iOS에서만 사용할 수 있습니다.".to_string())
    }
}
