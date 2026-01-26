import Foundation
import CloudKit
import UIKit
import os.log

// MARK: - CloudKit Backup Manager

private let cloudKitLog = OSLog(subsystem: "com.sisters.salon", category: "cloudkit")

public final class SalonCloudKit: @unchecked Sendable {

    static let instance = SalonCloudKit()

    private let containerID = "iCloud.com.sisters.salon"
    private let recordType = "SalonBackup"

    private var lastError: String = ""
    private var lastRecordId: String = ""

    private var container: CKContainer {
        CKContainer(identifier: containerID)
    }

    private var database: CKDatabase {
        container.privateCloudDatabase
    }

    init() {
        os_log("[SalonCloudKit] Initialized with container: %{public}@", log: cloudKitLog, type: .default, containerID)
    }

    func checkAvailable() -> Bool {
        os_log("[SalonCloudKit] checkAvailable called", log: cloudKitLog, type: .default)
        nonisolated(unsafe) var result = false
        let sem = DispatchSemaphore(value: 0)

        container.accountStatus { status, error in
            if let error = error {
                os_log("[SalonCloudKit] Account status error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
            }
            os_log("[SalonCloudKit] Account status: %d", log: cloudKitLog, type: .default, status.rawValue)
            result = (status == .available)
            sem.signal()
        }

        let timeout = sem.wait(timeout: .now() + 10)
        if timeout == .timedOut {
            os_log("[SalonCloudKit] checkAvailable timed out", log: cloudKitLog, type: .error)
            return false
        }

        os_log("[SalonCloudKit] checkAvailable result: %{public}@", log: cloudKitLog, type: .default, result ? "true" : "false")
        return result
    }

    func upload(path: String) -> Bool {
        os_log("[SalonCloudKit] upload called with path: %{public}@", log: cloudKitLog, type: .default, path)

        let url = URL(fileURLWithPath: path)
        guard FileManager.default.fileExists(atPath: path) else {
            lastError = "File not found: \(path)"
            os_log("[SalonCloudKit] Error: %{public}@", log: cloudKitLog, type: .error, lastError)
            return false
        }

        let filename = url.lastPathComponent
        os_log("[SalonCloudKit] Creating record for: %{public}@", log: cloudKitLog, type: .default, filename)

        let record = CKRecord(recordType: recordType, recordID: CKRecord.ID(recordName: filename))
        record["backupFile"] = CKAsset(fileURL: url)
        record["filename"] = filename
        record["deviceName"] = "iOS Device"
        record["createdDate"] = Date()

        if let attrs = try? FileManager.default.attributesOfItem(atPath: path),
           let size = attrs[.size] as? Int64 {
            record["fileSize"] = size
            os_log("[SalonCloudKit] File size: %lld bytes", log: cloudKitLog, type: .default, size)
        }

        nonisolated(unsafe) var success = false
        let sem = DispatchSemaphore(value: 0)

        os_log("[SalonCloudKit] Saving to CloudKit...", log: cloudKitLog, type: .default)
        database.save(record) { saved, error in
            if let error = error {
                self.lastError = error.localizedDescription
                os_log("[SalonCloudKit] Save error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
                success = false
            } else if let saved = saved {
                self.lastRecordId = saved.recordID.recordName
                os_log("[SalonCloudKit] Save success, recordID: %{public}@", log: cloudKitLog, type: .default, saved.recordID.recordName)
                success = true
            }
            sem.signal()
        }

        let timeout = sem.wait(timeout: .now() + 30)
        if timeout == .timedOut {
            lastError = "Upload timed out"
            os_log("[SalonCloudKit] Upload timed out", log: cloudKitLog, type: .error)
            return false
        }

        os_log("[SalonCloudKit] upload result: %{public}@", log: cloudKitLog, type: .default, success ? "true" : "false")
        return success
    }

    func getLastError() -> String { lastError }
    func getLastRecordId() -> String { lastRecordId }
}

// MARK: - Global C Functions (FFI exports)

@_cdecl("swift_cloudkit_available")
public func swift_cloudkit_available() -> Bool {
    os_log("[SalonCloudKit FFI] swift_cloudkit_available called", log: cloudKitLog, type: .default)
    let result = SalonCloudKit.instance.checkAvailable()
    os_log("[SalonCloudKit FFI] swift_cloudkit_available returning: %{public}@", log: cloudKitLog, type: .default, result ? "true" : "false")
    return result
}

@_cdecl("swift_cloudkit_upload")
public func swift_cloudkit_upload(_ pathPtr: UnsafePointer<CChar>) -> Bool {
    let path = String(cString: pathPtr)
    os_log("[SalonCloudKit FFI] swift_cloudkit_upload called with: %{public}@", log: cloudKitLog, type: .default, path)
    let result = SalonCloudKit.instance.upload(path: path)
    os_log("[SalonCloudKit FFI] swift_cloudkit_upload returning: %{public}@", log: cloudKitLog, type: .default, result ? "true" : "false")
    return result
}

@_cdecl("swift_cloudkit_last_error")
public func swift_cloudkit_last_error() -> UnsafePointer<CChar>? {
    let error = SalonCloudKit.instance.getLastError()
    os_log("[SalonCloudKit FFI] swift_cloudkit_last_error: %{public}@", log: cloudKitLog, type: .default, error.isEmpty ? "(empty)" : error)
    return error.isEmpty ? nil : (error as NSString).utf8String
}

@_cdecl("swift_cloudkit_last_record_id")
public func swift_cloudkit_last_record_id() -> UnsafePointer<CChar>? {
    let id = SalonCloudKit.instance.getLastRecordId()
    os_log("[SalonCloudKit FFI] swift_cloudkit_last_record_id: %{public}@", log: cloudKitLog, type: .default, id.isEmpty ? "(empty)" : id)
    return id.isEmpty ? nil : (id as NSString).utf8String
}

// MARK: - Registration function (called at app startup)
// This ensures the Swift code is linked and symbols are available

@_cdecl("swift_cloudkit_init")
public func swift_cloudkit_init() {
    // Use NSLog which is more visible than os_log
    NSLog("[SalonCloudKit] ========================================")
    NSLog("[SalonCloudKit] CloudKit module initialized")
    NSLog("[SalonCloudKit] Container: iCloud.com.sisters.salon")
    NSLog("[SalonCloudKit] ========================================")

    // Also print to stderr for debugging
    print("[SalonCloudKit] Swift CloudKit init called", to: &standardError)

    _ = SalonCloudKit.instance
}

// Helper for printing to stderr
var standardError = FileHandle.standardError

extension FileHandle: @retroactive TextOutputStream {
    public func write(_ string: String) {
        let data = Data(string.utf8)
        self.write(data)
    }
}
