#include "bindings/bindings.h"
#import <Foundation/Foundation.h>
#import <os/log.h>

// Declare Swift CloudKit functions (exported via @_cdecl)
extern "C" {
    void swift_cloudkit_init(void);
}

int main(int argc, char * argv[]) {
    // Use os_log for guaranteed visibility in Console
    os_log_t log = os_log_create("com.sisters.salon", "startup");
    os_log(log, "[main.mm] Starting app...");

    @autoreleasepool {
        // Initialize CloudKit module - this ensures Swift code is linked
        os_log(log, "[main.mm] Calling swift_cloudkit_init...");
        swift_cloudkit_init();
        os_log(log, "[main.mm] swift_cloudkit_init completed");
    }

    os_log(log, "[main.mm] Starting Tauri app...");
	ffi::start_app();
	return 0;
}
