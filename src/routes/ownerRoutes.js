const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware"); // JWT
const jwtToken = require("../controllers/jwtToken");
const authorizeRoles = require("../middleware/roleMiddleware"); // ✅ Import it


const ownerController = require("../controllers/ownerController");

const uploadTenant = require("../middleware/uploadTenant"); // JWT

// const tenantController = require("../controllers/tenantController");
const transactionController = require("../controllers/transactionController");
const tenantPrintController = require("../controllers/tenantPrintController");
// const siteController = require("../controllers/siteController");
const roomController = require("../controllers/roomController");
const roomLeavingController = require("../controllers/roomLeavingController");
const roomAllocationController = require("../controllers/roomAllocationController");
const reminderController = require("../controllers/reminderController");
const expenseController = require("../controllers/expenseController");
const adhaarController = require("../controllers/adhaarController");
const accountTypeController = require("../controllers/accountTypeController");





//client QCroutes
const clientController = require("../controllers/clientController");
const supervisorController = require("../controllers/supervisorController");
const partsController = require("../controllers/partsController");
const processController = require("../controllers/processController");
const newreportController = require("../controllers/newreportController");
const addqcController = require("../controllers/addqcController");
const reportqcController = require("../controllers/reportqcController");
const dailyReportController = require("../controllers/dailyReportController");
const partwisereportController = require("../controllers/partwisereportController");
const dayWiseReportController = require("../controllers/dayWiseReportController");
const locationwiseReportController = require("../controllers/locationwiseReportController");
const inspectorReportController = require("../controllers/inspectorReportController");
const allQCreportController = require("../controllers/AllQCreportController");
const userController = require("../controllers/userController");
const dashboardController = require("../controllers/dashboardController");
const ownerDashboardController = require("../controllers/ownerDashboardController");
const changepasswordController = require("../controllers/changepasswordController");
const assingtaskController = require("../controllers/assingtaskController");




// Save Token Route
router.post("/saveToken", jwtToken.saveToken);
router.get("/getToken", jwtToken.getToken);



//Client Registration
router.post("/rest_api_save_client", auth, clientController.saveClient);
router.get("/rest_api_get_all_client", auth, clientController.getAllClients);
router.post("/rest_api_update_client", auth, clientController.updateClient);
router.post("/rest_api_delete_client/:id", auth, clientController.deleteClient);
router.get("/rest_api_get_client_details/:id", clientController.getClientDetails);

router.get(
"/clients",
  auth, // JWT auth first
  authorizeRoles(['ROLE_SUP']), // Only supervisor
  clientController.getAllClients
);


router.get("/rest_api_get_all_companies", auth, clientController.getAllClientCompanies);


authorizeRoles(['role_admin', 'role_owner']), // then check roles

  //superusers Registration
router.post("/rest_api_save_supervisor", auth, supervisorController.saveSupervisor);
router.post("/rest_api_update_supervisor/:id", auth, supervisorController.updateSupervisor);
router.post("/rest_api_delete_supervisor/:id", auth, supervisorController.deleteSupervisor);
router.get("/rest_api_get_supervisor/:id", auth, supervisorController.getSupervisorById);
router.get("/rest_api_get_all_supervisors", auth, supervisorController.getAllSupervisors);


//partsController Registration
router.post("/rest_api_save_part", auth, partsController.savePart);
router.post("/rest_api_update_part", auth, partsController.updatePart);
router.post("/rest_api_delete_part/:id", auth, partsController.deletePart);
router.get("/rest_api_get_all_parts", auth, partsController.getAllParts);
router.get("/rest_api_get_part_details/:id", auth, partsController.getPartDetails);
router.get("/parts", auth, partsController.getAllParts);
router.get("/rest_api_get_parts_by_company/:company", auth, partsController.getPartsByCompany);
router.get("/rest_api_get_user_company", auth, partsController.getUserCompany);


// processController Routes
router.get("/rest_api_get_all_process", auth, processController.getAllProcesses);
router.get("/rest_api_get_process_details/:id", auth, processController.getProcessDetails);
router.post("/rest_api_save_process", auth, processController.saveProcess);
router.post("/rest_api_update_process", auth, processController.updateProcess);
router.post("/rest_api_delete_process/:id", auth, processController.deleteProcess);
// router.get("/rest_api_get_parts_by_company/:company", processController.getPartsByCompany);



// addqcController Add QC Routes
router.post("/rest_api_save_qc", auth, addqcController.saveQC);
router.get("/rest_api_get_all_qc", auth, addqcController.getAllQC);
router.get("/get_parts_for_user", auth, addqcController.getPartsForUser);
router.get("/me", auth, addqcController.getMe);
router.get("/get_locations_by_client", auth, addqcController.getLocationsByClient);



//reportController Report Routes
router.post("/rest_api_save_qc_defect", reportqcController.saveQCDefect);
router.post("/rest_api_update_qc_defect", reportqcController.updateQCDefect);
router.delete("/rest_api_delete_qc_defect/:id", reportqcController.deleteQCDefect);
router.get("/rest_api_get_all_defects", reportqcController.getAllDefects);
router.get("/rest_api_get_qc_defects/:addqc_id", reportqcController.getQCDefectsByAddqcId);



// newreportController New Report Routes
router.get("/rest_api_get_all_reports", auth, newreportController.getAllReports);
router.post("/rest_api_save_report", auth, newreportController.saveReport);
router.post("/rest_api_update_report", auth, newreportController.updateReport);
router.get("/rest_api_get_report/:id", auth, newreportController.getReportById);
router.post("/rest_api_delete_report/:id", auth, newreportController.deleteReport);



// dailyReportController Daily Report Routes
router.get("/rest_api_get_all_daily_report", auth, dailyReportController.getAllDailyReports);
router.get("/rest_api_get_user_client", auth, dailyReportController.getUserClient);
router.get("/rest_api_get_daily_report_by_date/:date", auth, dailyReportController.getDailyReportByDate);



// partwisereportController Part-wise Report Routes
router.get("/rest_api_partwise_report", auth, partwisereportController.getPartWiseReport);
router.get("/rest_api_get_companies_with_parts", auth, partwisereportController.getCompaniesWithParts);



// dayWiseReportController Day-wise Report Routes
router.get("/rest_api_daywise_report", auth, dayWiseReportController.getDayWiseReport);



// locationwiseReportController Location-wise Report Routes
router.get("/rest_api_locationwise_report", auth, locationwiseReportController.getLocationWiseReport);



// inspectorReportController Inspector-wise Report Routes
router.get("/rest_api_get_inspector_report", auth, inspectorReportController.getInspectorWiseReport);
router.get("/rest_api_get_all_employee", auth, inspectorReportController.getCompanyWiseEmployees);


// All QC Report Routes
router.get("/rest_api_company_qc_reports", auth, allQCreportController.getCompanyQcReports);
router.get("/company-employees", auth, allQCreportController.getCompanyEmployees);



// userController User Routes
router.post("/rest_api_get_user_details", auth, userController.getUserDetails);
router.get("/api/dashboard/username", auth, userController.getUsername);

  

// dashboardController Routes
router.get("/rest_api_dashboard_users_count", auth, dashboardController.getTotalUsers);
router.get("/rest_api_dashboard_parts_count", auth, dashboardController.getTotalParts);
router.get("/rest_api_dashboard_qc_count", auth, dashboardController.getTotalQC);
router.get("/rest_api_dashboard_stats", auth, dashboardController.getQCStats);
router.get("/rest_api_dashboard_qc_recent", auth, dashboardController.getTotalQCreport);

// fetch data on data table
router.get("/rest_api_get_all_users", auth, dashboardController.getAllUsers)
router.get("/rest_api_get_all_parts_dashboard", auth, dashboardController.getAllPartsDashbord);
router.get("/rest_api_get_all_qc_entries", auth, dashboardController.getAllQCEntries);
router.get("/rest_api_dashboard_qc_recent", auth, dashboardController.getAllReportQCEntries);



// HrDashboard Routes
router.get("/rest_api_shift_wise_report", auth, dashboardController.getShiftWiseReport);
router.get("/rest_api_defect_wise_report", auth, dashboardController.getDefectWiseReport);
router.get("/rest_api_part_wise_report", auth, dashboardController.getPartWiseReport);
router.get("/rest_api_inspector_wise_report", auth, dashboardController.getInspectorWiseReport);




// Owner Dashboard Routes

// User Details
// router.post("/rest_api_get_user_details", auth, dashboardController.getUserDetails);

// Total / Active / Inactive Workers
router.get("/rest_api_total_users", auth, dashboardController.getAllTotalUsers);
router.get("/rest_api_active_status", auth, dashboardController.getActiveUsers);
router.get("/rest_api_inactive_status", auth, dashboardController.getInactiveUsers);

// Clients and Employees
router.get("/rest_api_get_all_clients", auth, dashboardController.getAllClients);
router.get('/rest_api_get_users_by_client/:clientName', dashboardController.getUsersByClient);
router.get("/rest_api_performance_stats", auth, dashboardController.getQCPerformanceData);
router.get("/rest_api_chart_data", auth, dashboardController.getMonthlyWorkTrend);


//Employee Details

router.get("/rest_api_supervisor_dashboard", auth ,dashboardController.getSupervisorDashboard);



// Owner Dashboard - Owner Management and Site Management

router.get("/rest_api_get_all_client_owner", auth, ownerDashboardController.getAllClientsOwner);
router.get("/rest_api_get_parts_by_client/:client_id", auth, ownerDashboardController.getPartsByClient);
router.get("/rest_api_get_inspectors/:client_id", auth, ownerDashboardController.getInspectorsByClient);
router.get("/rest_api_dashboard_owner", auth, ownerDashboardController.getOwnerDashboardData);




// Change Password Route
router.post("/rest_api_get_role", auth, changepasswordController.getLoggedUserInfo);
router.post("/rest_api_change_user_password", auth, changepasswordController.changePassword);




// Assing Task Routes
router.get("/rest_api_get_hr_managers_by_company/:companyId", auth, assingtaskController.getHRManagersByCompany);
router.get("/rest_api_get_all_assignments", auth, assingtaskController.getAllAssignments);
router.delete("/rest_api_delete_assignment/:id", auth, assingtaskController.deleteAssignment);
router.post("/rest_api_create_assignment", auth, assingtaskController.createAssignment);


router.get("/rest_api_get_assignment_count/:inspectorId", auth, assingtaskController.getAssignmentCount);
router.get("/rest_api_get_my_assignments/:inspectorId", auth, assingtaskController.getMyAssignments);
router.post("/rest_api_update_assignment_status", auth, assingtaskController.updateAssignmentStatus);
router.get("/rest_api_get_user_details_by_task", auth, assingtaskController.getUserDetailsTask);

































router.post("/api_save_owner", auth, ownerController.saveOwner);
router.post("/api_update_owner", auth, ownerController.updateOwner);
router.post("/api_get_owner_ag_id", auth, ownerController.getOwnerById);
router.post("/api_get_all_owners_desc", auth, ownerController.getAllOwnersDesc);
// router.post("/api_ajax_save_tenant", uploadTenant.single("image"), auth, tenantController.saveTenant);
// router.post("/api_get_all_sites_by_owner", auth, siteController.getSitesByOwner);
router.post("/api_get_all_owners_asc", auth, ownerController.getAllOwnersAsc);
router.post("/api_get_all_owner_and_tenant_details", auth, ownerController.getOwnerTenantDetails);

// router.post("/api_save_site", auth, siteController.saveSite);
// router.post("/api_update_site", auth, siteController.updateSite);
// router.post("/api_get_site_details_ag_id", auth, siteController.getSiteDetails);
router.post("/rest_api_adhaar_search_report_details", auth, adhaarController.sendAadhaarOtp);
router.post("/rest_api_verify_aadhaar_otp", auth, adhaarController.verifyAadhaarOtp);

// router.post(
//   "/api_update_owner_details_site_master",
//   auth,
//   uploadTenant.single("owner_image"), // 🔴 REQUIRED
//   siteController.updateOwnerDetailsAtSite
// );

// router.post(
//   "/rest_api_save_site_images",
//   auth,
//   uploadTenant.single("site_image"), // 🔴 must match frontend
//   siteController.saveSiteImages
// );

// router.post(
//   '/api_get_tenant_details_as_yes_status',
//   auth,
//   tenantController.getTenantsWithYesStatus
// );

// router.post(
//   '/api_get_tenant_details_as_no_status',
//   auth,
//   tenantController.getTenantsWithNoStatus
// );

// router.post("/api_get_site_ag_id", siteController.getSiteById);
router.post("/api_get_all_rooms_by_site_floor", auth, roomController.getRoomsBySiteFloor);
router.post("/api_save_room", auth, roomController.saveRooms);
// router.post("/api_no_status_tenant", auth, tenantController.noStatusTenants);

router.post("/api_get_main_person_status", auth, roomController.getMainPersonStatus);
router.post("/api_save_roomallocation", auth, roomAllocationController.saveRoomAllocation);
// router.post("/api_get_all_tenants_asc", auth, tenantController.getTenantsAsc);

// router.post("/api_get_all_tenants_desc", auth, tenantController.getTenantsDesc);

// router.post(
//   "/api_get_all_tenants_ags_owner_id",
//   auth,
//   tenantController.getTenantListOwnerId
// );

// router.post("/api_yes_status_tenant", tenantController.yesStatusTenants);

router.post(
  "/api_get_room_details",
  auth,
  roomAllocationController.getRoomDetails
);

router.post("/api_save_roomleaving_details", auth, roomAllocationController.saveRoomLeaving);

router.post("/rest_api_get_counter_details", auth, transactionController.getCounterDetails);

router.post("/api_get_all_reminder_details_active", auth, reminderController.getActiveReminders);

router.post("/rest_api_get_transaction_details", auth, transactionController.getTransactionDetails);
router.post("/api_get_all_rooms__details_by_owner_id_and_site_id", auth, transactionController.getRoomsByOwnerAndSite);
router.post("/rest_api_save_room_details_at_transaction", auth, transactionController.saveRoomTransaction);
router.post("/rest_api_update_room_details_at_transaction", auth, transactionController.updateRoomTransaction);





// router.post("/api_get_all_rooms_by_site", auth, roomController.getRoomsBySite);
// router.post("/rest_api_get_receipt_details", auth, transactionController.getReceiptDetails);
// router.post("/rest_api_get_total_balance_from_transaction", auth, transactionController.getTotalBalanceFromTransaction);
// router.post("/api_get_all_account_type_list", auth, accountTypeController.getAllAccountTypeList);
// router.post("/rest_api_update_receipt_at_transaction", auth, transactionController.updateReceipt);
// router.post("/rest_api_save_receipt_at_transaction", auth, transactionController.saveReceipt);

// router.post("/api_get_all_expense_details", auth, expenseController.getAllExpenses);
// router.post("/rest_api_save_expense_details", auth, expenseController.saveExpense);
// router.post("/rest_api_update_expense_details", auth, expenseController.updateExpense);
// router.post("/rest_api_delete_expense_details", auth, expenseController.deleteExpense);

// router.post("/api_get_all_tenant_details_for_report", auth, tenantController.getAllTenantDetailsForReport);

// router.post("/rest_api_get_billing_details_for_report", auth, transactionController.getBillingDetailsForReport);
// router.post("/api_get_expense_details_for_report", auth, expenseController.getExpenseReport);
// router.post("/rest_api_get_receipt_details_for_report", auth, transactionController.getReceiptDetailsForReport);
// router.post("/api_get_all_tenant_details_for_leaving_report",auth,tenantController.tenantLeavingReport);
//  router.post("/api_get_all_reminder_details", auth, reminderController.getAllReminders);


//   router.post("/rest_api_save_reminder_details", auth, reminderController.saveReminder);
//  router.post("/rest_api_update_reminder_details", auth, reminderController.updateReminder);
//  router.post("/rest_api_delete_reminder_details", auth, reminderController.deleteReminder);




module.exports = router;
