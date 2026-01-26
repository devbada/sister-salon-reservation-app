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

    // List all backups from CloudKit using CKQueryOperation for better control
    // Returns JSON array: [{"id":"...", "filename":"...", "size":123, "createdAt":"..."}]
    func listBackups() -> String {
        os_log("[SalonCloudKit] listBackups called", log: cloudKitLog, type: .default)

        let query = CKQuery(recordType: recordType, predicate: NSPredicate(value: true))
        // Note: sortDescriptors don't work reliably with perform() API, we'll sort manually

        nonisolated(unsafe) var allRecords: [CKRecord] = []
        nonisolated(unsafe) var resultJson = "[]"
        let sem = DispatchSemaphore(value: 0)

        let operation = CKQueryOperation(query: query)
        operation.resultsLimit = 100  // Fetch up to 100 records

        // Use deprecated API for iOS 14 compatibility
        operation.recordFetchedBlock = { record in
            allRecords.append(record)
        }

        operation.queryCompletionBlock = { cursor, error in
            if let error = error {
                self.lastError = error.localizedDescription
                os_log("[SalonCloudKit] List error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
                sem.signal()
                return
            }

            os_log("[SalonCloudKit] Query completed, total records: %d", log: cloudKitLog, type: .default, allRecords.count)

            // Sort by createdDate descending (newest first)
            let sortedRecords = allRecords.sorted { r1, r2 in
                let d1 = r1["createdDate"] as? Date ?? Date.distantPast
                let d2 = r2["createdDate"] as? Date ?? Date.distantPast
                return d1 > d2
            }

            var backups: [[String: Any]] = []
            let formatter = ISO8601DateFormatter()

            for record in sortedRecords {
                var backup: [String: Any] = [
                    "id": record.recordID.recordName,
                    "filename": record["filename"] as? String ?? record.recordID.recordName
                ]
                if let size = record["fileSize"] as? Int64 {
                    backup["size"] = size
                }
                if let date = record["createdDate"] as? Date {
                    backup["createdAt"] = formatter.string(from: date)
                }
                backups.append(backup)
            }

            if let jsonData = try? JSONSerialization.data(withJSONObject: backups),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                resultJson = jsonString
            }
            os_log("[SalonCloudKit] Found %d backups", log: cloudKitLog, type: .default, backups.count)
            sem.signal()
        }

        database.add(operation)

        let timeout = sem.wait(timeout: .now() + 30)
        if timeout == .timedOut {
            lastError = "List timed out"
            os_log("[SalonCloudKit] listBackups timed out", log: cloudKitLog, type: .error)
        }

        return resultJson
    }

    // Delete a backup from CloudKit by record ID
    func deleteBackup(recordId: String) -> Bool {
        os_log("[SalonCloudKit] deleteBackup called for: %{public}@", log: cloudKitLog, type: .default, recordId)

        let recordID = CKRecord.ID(recordName: recordId)
        nonisolated(unsafe) var success = false
        let sem = DispatchSemaphore(value: 0)

        database.delete(withRecordID: recordID) { deletedRecordID, error in
            if let error = error {
                self.lastError = error.localizedDescription
                os_log("[SalonCloudKit] Delete error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
                success = false
            } else {
                os_log("[SalonCloudKit] Delete success: %{public}@", log: cloudKitLog, type: .default, recordId)
                success = true
            }
            sem.signal()
        }

        let timeout = sem.wait(timeout: .now() + 30)
        if timeout == .timedOut {
            lastError = "Delete timed out"
            os_log("[SalonCloudKit] deleteBackup timed out", log: cloudKitLog, type: .error)
            return false
        }

        return success
    }

    // Download a backup from CloudKit by record ID
    // Returns the local file path where the backup was saved, or nil on error
    func downloadBackup(recordId: String, destinationPath: String) -> Bool {
        os_log("[SalonCloudKit] downloadBackup called for: %{public}@ -> %{public}@", log: cloudKitLog, type: .default, recordId, destinationPath)

        let recordID = CKRecord.ID(recordName: recordId)
        nonisolated(unsafe) var success = false
        let sem = DispatchSemaphore(value: 0)

        database.fetch(withRecordID: recordID) { record, error in
            if let error = error {
                self.lastError = error.localizedDescription
                os_log("[SalonCloudKit] Download fetch error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
                success = false
                sem.signal()
                return
            }

            guard let record = record,
                  let asset = record["backupFile"] as? CKAsset,
                  let assetURL = asset.fileURL else {
                self.lastError = "Backup file not found in record"
                os_log("[SalonCloudKit] Backup file not found in record", log: cloudKitLog, type: .error)
                success = false
                sem.signal()
                return
            }

            do {
                let destURL = URL(fileURLWithPath: destinationPath)
                // Remove existing file if present
                if FileManager.default.fileExists(atPath: destinationPath) {
                    try FileManager.default.removeItem(at: destURL)
                }
                // Copy the asset to destination
                try FileManager.default.copyItem(at: assetURL, to: destURL)
                os_log("[SalonCloudKit] Download success: %{public}@", log: cloudKitLog, type: .default, destinationPath)
                success = true
            } catch {
                self.lastError = error.localizedDescription
                os_log("[SalonCloudKit] Download copy error: %{public}@", log: cloudKitLog, type: .error, error.localizedDescription)
                success = false
            }
            sem.signal()
        }

        let timeout = sem.wait(timeout: .now() + 60)
        if timeout == .timedOut {
            lastError = "Download timed out"
            os_log("[SalonCloudKit] downloadBackup timed out", log: cloudKitLog, type: .error)
            return false
        }

        return success
    }
}

// MARK: - Global C Functions (FFI exports)

// Global variables to hold string results (to prevent deallocation and dangling pointers)
// These must be stored globally because the returned pointers are used by Rust after the function returns
nonisolated(unsafe) var lastListResult: NSString?
nonisolated(unsafe) var lastErrorResult: NSString?
nonisolated(unsafe) var lastRecordIdResult: NSString?

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
    if error.isEmpty {
        return nil
    }
    // Store in global variable to prevent deallocation
    lastErrorResult = error as NSString
    return lastErrorResult?.utf8String
}

@_cdecl("swift_cloudkit_last_record_id")
public func swift_cloudkit_last_record_id() -> UnsafePointer<CChar>? {
    let id = SalonCloudKit.instance.getLastRecordId()
    os_log("[SalonCloudKit FFI] swift_cloudkit_last_record_id: %{public}@", log: cloudKitLog, type: .default, id.isEmpty ? "(empty)" : id)
    if id.isEmpty {
        return nil
    }
    // Store in global variable to prevent deallocation
    lastRecordIdResult = id as NSString
    return lastRecordIdResult?.utf8String
}

@_cdecl("swift_cloudkit_list")
public func swift_cloudkit_list() -> UnsafePointer<CChar>? {
    os_log("[SalonCloudKit FFI] swift_cloudkit_list called", log: cloudKitLog, type: .default)
    let result = SalonCloudKit.instance.listBackups()
    lastListResult = result as NSString
    os_log("[SalonCloudKit FFI] swift_cloudkit_list returning %d chars", log: cloudKitLog, type: .default, result.count)
    return lastListResult?.utf8String
}

@_cdecl("swift_cloudkit_delete")
public func swift_cloudkit_delete(_ recordIdPtr: UnsafePointer<CChar>) -> Bool {
    let recordId = String(cString: recordIdPtr)
    os_log("[SalonCloudKit FFI] swift_cloudkit_delete called for: %{public}@", log: cloudKitLog, type: .default, recordId)
    let result = SalonCloudKit.instance.deleteBackup(recordId: recordId)
    os_log("[SalonCloudKit FFI] swift_cloudkit_delete returning: %{public}@", log: cloudKitLog, type: .default, result ? "true" : "false")
    return result
}

@_cdecl("swift_cloudkit_download")
public func swift_cloudkit_download(_ recordIdPtr: UnsafePointer<CChar>, _ destPathPtr: UnsafePointer<CChar>) -> Bool {
    let recordId = String(cString: recordIdPtr)
    let destPath = String(cString: destPathPtr)
    os_log("[SalonCloudKit FFI] swift_cloudkit_download called for: %{public}@ -> %{public}@", log: cloudKitLog, type: .default, recordId, destPath)
    let result = SalonCloudKit.instance.downloadBackup(recordId: recordId, destinationPath: destPath)
    os_log("[SalonCloudKit FFI] swift_cloudkit_download returning: %{public}@", log: cloudKitLog, type: .default, result ? "true" : "false")
    return result
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
    _ = SalonCloudKit.instance
}
