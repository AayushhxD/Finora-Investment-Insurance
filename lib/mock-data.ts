import type {
  Staff, Customer, Lead, Product, Application, Document, Message,
  Renewal, Referral, Reward, ActivityLog, Notification, RewardRule,
  LeadDistributionRecord
} from './store-types'
import { newId } from './store'

// ─── Staff ────────────────────────────────────────────────────────────────────
export function seedStaff(): Staff[] {
  return [
    { id: 's1', name: 'Rahul Mehta', email: 'rahul@finora.in', phone: '9876543210', role: 'RM', status: 'active', specialty: 'Mutual Funds', maxCapacity: 40, joinedAt: '2024-01-10', createdAt: '2024-01-10T00:00:00Z' },
    { id: 's2', name: 'Priya Shah', email: 'priya@finora.in', phone: '9876543211', role: 'RM', status: 'active', specialty: 'Insurance', maxCapacity: 35, joinedAt: '2024-02-15', createdAt: '2024-02-15T00:00:00Z' },
    { id: 's3', name: 'Vivek Shah', email: 'vivek@finora.in', phone: '9876543212', role: 'RM', status: 'active', specialty: 'Demat / Market', maxCapacity: 25, joinedAt: '2023-11-01', createdAt: '2023-11-01T00:00:00Z' },
    { id: 's4', name: 'Meera Joshi', email: 'meera@finora.in', phone: '9876543213', role: 'RM', status: 'active', specialty: 'Insurance', maxCapacity: 35, joinedAt: '2024-03-20', createdAt: '2024-03-20T00:00:00Z' },
    { id: 's5', name: 'Kiran Desai', email: 'kiran@finora.in', phone: '9876543214', role: 'Manager', status: 'active', specialty: 'Operations', maxCapacity: 30, joinedAt: '2024-01-05', createdAt: '2024-01-05T00:00:00Z' },
    { id: 's6', name: 'Neha Kapoor', email: 'neha@finora.in', phone: '9876543215', role: 'RM', status: 'inactive', specialty: 'Insurance', maxCapacity: 35, joinedAt: '2024-01-05', createdAt: '2024-01-05T00:00:00Z' },
  ]
}

// ─── Products ─────────────────────────────────────────────────────────────────
export function seedProducts(): Product[] {
  return [
    { id: 'p1', name: 'HDFC Top 100 Fund', category: 'Investment', subCategory: 'Mutual Fund', description: 'Large cap equity mutual fund with consistent returns', eligibility: 'Age 18+, KYC complete', requiredDocs: ['PAN', 'Aadhaar', 'Bank Statement', 'Cancelled Cheque'], risk: 'High', minInvestment: 5000, returnPa: 14.5, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p2', name: 'LIC Jeevan Anand', category: 'Insurance', subCategory: 'LIC', description: 'Endowment with profits life insurance plan', eligibility: 'Age 18-50, medical test required', requiredDocs: ['PAN', 'Aadhaar', 'Photo', 'Medical Report'], risk: 'Low', minInvestment: 12000, returnPa: 6.5, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p3', name: 'SBI Life Smart Humsafar', category: 'Insurance', subCategory: 'Life Insurance', description: 'Joint life insurance plan for couples', eligibility: 'Age 18-45 couples', requiredDocs: ['PAN', 'Aadhaar', 'Marriage Certificate', 'Photo'], risk: 'Low', minInvestment: 18000, returnPa: 7.2, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p4', name: 'Star Health Comprehensive', category: 'Insurance', subCategory: 'Health Insurance', description: 'Comprehensive health insurance with cashless network', eligibility: 'Age 5-65, health declaration', requiredDocs: ['PAN', 'Aadhaar', 'Photo', 'Health Declaration'], risk: 'Low', minInvestment: 8500, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p5', name: 'Zerodha Demat Account', category: 'Demat', subCategory: 'Demat Account', description: 'Zero brokerage demat and trading account', eligibility: 'Age 18+, Indian resident', requiredDocs: ['PAN', 'Aadhaar', 'Bank Statement', 'Cancelled Cheque', 'Photo'], risk: 'High', minInvestment: 0, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p6', name: 'Axis Bluechip Fund', category: 'Investment', subCategory: 'Mutual Fund', description: 'Bluechip equity fund investing in top 30 companies', eligibility: 'Age 18+, KYC complete', requiredDocs: ['PAN', 'Aadhaar', 'Bank Statement'], risk: 'Medium', minInvestment: 1000, returnPa: 12.8, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p7', name: 'NHAI Bond 2026', category: 'Investment', subCategory: 'Bond', description: 'Government-backed infrastructure bond', eligibility: 'Age 18+, Indian resident', requiredDocs: ['PAN', 'Aadhaar', 'Bank Account Proof'], risk: 'Low', minInvestment: 10000, returnPa: 8.1, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p8', name: 'Bajaj Personal Accident', category: 'Insurance', subCategory: 'Personal Accident', description: 'Coverage for accidental death and disability', eligibility: 'Age 18-65, any occupation', requiredDocs: ['PAN', 'Aadhaar', 'Photo'], risk: 'Low', minInvestment: 2500, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  ]
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function seedCustomers(): Customer[] {
  return [
    { id: 'c1', name: 'Raj Patil', email: 'raj@example.com', phone: '9800001111', address: '12, MG Road, Pune', city: 'Pune', dob: '1985-06-15', panNumber: 'ABCDE1234F', assignedStaffId: 's1', status: 'active', referralCode: 'RAJ2024', createdAt: '2024-06-01T00:00:00Z' },
    { id: 'c2', name: 'Sneha Mehta', email: 'sneha@example.com', phone: '9800002222', address: '45, Park Street, Mumbai', city: 'Mumbai', dob: '1990-03-22', panNumber: 'FGHIJ5678K', assignedStaffId: 's1', status: 'active', referralCode: 'SNE2024', createdAt: '2024-06-15T00:00:00Z' },
    { id: 'c3', name: 'Arun Kumar', email: 'arun@example.com', phone: '9800003333', address: '7, Civil Lines, Delhi', city: 'Delhi', dob: '1978-11-08', panNumber: 'KLMNO9012P', assignedStaffId: 's2', status: 'active', referralCode: 'ARU2024', createdAt: '2024-07-01T00:00:00Z' },
    { id: 'c4', name: 'Divya Nair', email: 'divya@example.com', phone: '9800004444', address: '23, Brigade Road, Bangalore', city: 'Bangalore', dob: '1992-07-30', panNumber: 'PQRST3456U', assignedStaffId: 's2', status: 'active', referralCode: 'DIV2024', createdAt: '2024-07-20T00:00:00Z' },
    { id: 'c5', name: 'Mohit Verma', email: 'mohit@example.com', phone: '9800005555', address: '56, Ring Road, Hyderabad', city: 'Hyderabad', dob: '1988-04-12', panNumber: 'UVWXY7890Z', assignedStaffId: 's3', status: 'active', referralCode: 'MOH2024', createdAt: '2024-08-01T00:00:00Z' },
    { id: 'c6', name: 'Anita Gupta', email: 'anita@example.com', phone: '9800006666', address: '34, Jodhpur Park, Kolkata', city: 'Kolkata', dob: '1995-12-25', panNumber: 'ABCYZ1111Q', assignedStaffId: 's4', status: 'prospect', referralCode: 'ANI2024', createdAt: '2024-08-15T00:00:00Z' },
    { id: 'c7', name: 'Vikram Bose', email: 'vikram@example.com', phone: '9800007777', address: '89, Lake Gardens, Kolkata', city: 'Kolkata', dob: '1982-09-05', panNumber: 'DEFAB2222R', assignedStaffId: 's4', status: 'active', referralCode: 'VIK2024', createdAt: '2024-09-01T00:00:00Z' },
  ]
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export function seedLeads(): Lead[] {
  const n = () => new Date().toISOString()
  return [
    { id: 'l1', name: 'Suresh Pillai', email: 'suresh@example.com', phone: '9700001111', productInterest: 'Mutual Fund', source: 'REFERRAL', status: 'INTERESTED', assignedStaffId: 's1', referredByCustomerId: 'c1', notes: 'Interested in SIP investments. Has ₹10k/month to invest.', createdAt: '2024-09-01T09:00:00Z', updatedAt: '2024-09-02T10:00:00Z' },
    { id: 'l2', name: 'Kavita Rao', email: 'kavita@example.com', phone: '9700002222', productInterest: 'Health Insurance', source: 'WEBSITE', status: 'CONTACTED', assignedStaffId: 's2', notes: 'Looking for family floater health insurance', createdAt: '2024-09-02T11:00:00Z', updatedAt: '2024-09-02T15:00:00Z' },
    { id: 'l3', name: 'Rajan Malhotra', email: 'rajan@example.com', phone: '9700003333', productInterest: 'LIC', source: 'WALK_IN', status: 'NEW', assignedStaffId: 's3', notes: 'Came in asking about LIC endowment plans', createdAt: '2024-09-03T10:00:00Z', updatedAt: '2024-09-03T10:00:00Z' },
    { id: 'l4', name: 'Preethi Iyer', email: 'preethi@example.com', phone: '9700004444', productInterest: 'Demat Account', source: 'SOCIAL_MEDIA', status: 'FOLLOW_UP', assignedStaffId: 's1', notes: 'Active trader, wants low-brokerage demat account', createdAt: '2024-09-01T14:00:00Z', updatedAt: '2024-09-04T09:00:00Z' },
    { id: 'l5', name: 'Sanjay Mehta', email: 'sanjay@example.com', phone: '9700005555', productInterest: 'Bond', source: 'PHONE', status: 'CONVERTED', assignedStaffId: 's2', convertedCustomerId: 'c5', notes: 'Conservative investor, prefers fixed income', createdAt: '2024-08-20T09:00:00Z', updatedAt: '2024-08-28T16:00:00Z' },
    { id: 'l6', name: 'Meera Thomas', email: 'meera@example.com', phone: '9700006666', productInterest: 'Life Insurance', source: 'REFERRAL', status: 'LOST', assignedStaffId: 's4', referredByCustomerId: 'c3', notes: 'Chose competitor policy', createdAt: '2024-08-15T09:00:00Z', updatedAt: '2024-08-22T11:00:00Z' },
    { id: 'l7', name: 'Neha Shah', email: 'neha.shah@example.com', phone: '9700007777', productInterest: 'Health Insurance', source: 'WEBSITE', status: 'NEW', priority: 'HIGH', notes: 'Website enquiry — family floater needed urgently', createdAt: new Date(Date.now() - 9 * 60000).toISOString(), updatedAt: new Date(Date.now() - 9 * 60000).toISOString() },
    { id: 'l8', name: 'Vikram Rao', email: 'vikram@example.com', phone: '9700008888', productInterest: 'Mutual Fund', source: 'REFERRAL', status: 'NEW', priority: 'MEDIUM', notes: 'Referral from existing customer', createdAt: new Date(Date.now() - 24 * 60000).toISOString(), updatedAt: new Date(Date.now() - 24 * 60000).toISOString() },
    { id: 'l9', name: 'Anjali Patil', email: 'anjali@example.com', phone: '9700009999', productInterest: 'Demat Account', source: 'WEBSITE', status: 'NEW', priority: 'NORMAL', notes: 'Interested in zero-brokerage demat', createdAt: new Date(Date.now() - 41 * 60000).toISOString(), updatedAt: new Date(Date.now() - 41 * 60000).toISOString() },
    { id: 'l10', name: 'Rohan Kulkarni', email: 'rohan@example.com', phone: '9700000000', productInterest: 'Life Insurance', source: 'PHONE', status: 'NEW', priority: 'MEDIUM', notes: 'Called in asking about LIC plans', createdAt: new Date(Date.now() - 60 * 60000).toISOString(), updatedAt: new Date(Date.now() - 60 * 60000).toISOString() },
  ]
}

// ─── Applications ─────────────────────────────────────────────────────────────
export function seedApplications(): Application[] {
  return [
    {
      id: 'a1', customerId: 'c1', staffId: 's1', productId: 'p1',
      status: 'DOCUMENTS_REQUESTED', pendingWith: 'Customer', nextAction: 'Upload required documents',
      notes: 'Customer interested in SIP. Documents requested on 5 Sep.',
      renewalDate: undefined,
      statusHistory: [
        { status: 'LEAD_CREATED', timestamp: '2024-09-01T09:00:00Z', note: 'Lead created from website enquiry', performedBy: 'Amit Singh' },
        { status: 'STAFF_ASSIGNED', timestamp: '2024-09-01T10:00:00Z', note: 'Assigned to Amit Singh', performedBy: 'Priya Patel' },
        { status: 'PRODUCT_SELECTED', timestamp: '2024-09-02T11:00:00Z', note: 'HDFC Top 100 Fund selected', performedBy: 'Amit Singh' },
        { status: 'CUSTOMER_INTERESTED', timestamp: '2024-09-03T14:00:00Z', note: 'Customer confirmed interest after discussion', performedBy: 'Amit Singh' },
        { status: 'DOCUMENTS_REQUESTED', timestamp: '2024-09-05T10:00:00Z', note: 'PAN, Aadhaar, Bank Statement requested', performedBy: 'Amit Singh' },
      ],
      createdAt: '2024-09-01T09:00:00Z', updatedAt: '2024-09-05T10:00:00Z'
    },
    {
      id: 'a2', customerId: 'c2', staffId: 's1', productId: 'p4',
      status: 'PROCESSING', pendingWith: 'Provider', nextAction: 'Awaiting provider processing',
      notes: 'Star Health Family Floater - 2 adults, 2 children',
      renewalDate: undefined,
      statusHistory: [
        { status: 'LEAD_CREATED', timestamp: '2024-08-15T09:00:00Z', note: 'Walk-in customer', performedBy: 'Amit Singh' },
        { status: 'STAFF_ASSIGNED', timestamp: '2024-08-15T09:30:00Z', note: 'Assigned to Amit Singh', performedBy: 'Amit Singh' },
        { status: 'PRODUCT_SELECTED', timestamp: '2024-08-16T11:00:00Z', note: 'Star Health Comprehensive selected', performedBy: 'Amit Singh' },
        { status: 'CUSTOMER_INTERESTED', timestamp: '2024-08-17T14:00:00Z', note: 'Confirmed', performedBy: 'Amit Singh' },
        { status: 'DOCUMENTS_REQUESTED', timestamp: '2024-08-18T10:00:00Z', note: 'Documents requested', performedBy: 'Amit Singh' },
        { status: 'DOCUMENTS_RECEIVED', timestamp: '2024-08-22T15:00:00Z', note: 'All documents received and verified', performedBy: 'Amit Singh' },
        { status: 'SUBMITTED', timestamp: '2024-08-24T10:00:00Z', note: 'Application submitted to Star Health', performedBy: 'Amit Singh' },
        { status: 'PROCESSING', timestamp: '2024-08-26T09:00:00Z', note: 'Provider is processing', performedBy: 'system' },
      ],
      createdAt: '2024-08-15T09:00:00Z', updatedAt: '2024-08-26T09:00:00Z'
    },
    {
      id: 'a3', customerId: 'c3', staffId: 's2', productId: 'p7',
      status: 'COMPLETED', pendingWith: 'None', nextAction: 'Application complete — renewal scheduled',
      notes: 'NHAI Bond investment completed successfully',
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      statusHistory: [
        { status: 'LEAD_CREATED', timestamp: '2024-07-01T09:00:00Z', note: 'Enquiry from website', performedBy: 'Rahul Sharma' },
        { status: 'STAFF_ASSIGNED', timestamp: '2024-07-01T10:00:00Z', note: 'Assigned to Rahul Sharma', performedBy: 'Priya Patel' },
        { status: 'PRODUCT_SELECTED', timestamp: '2024-07-02T11:00:00Z', note: 'NHAI Bond selected', performedBy: 'Rahul Sharma' },
        { status: 'CUSTOMER_INTERESTED', timestamp: '2024-07-04T14:00:00Z', note: 'Interested confirmed', performedBy: 'Rahul Sharma' },
        { status: 'DOCUMENTS_REQUESTED', timestamp: '2024-07-05T10:00:00Z', note: 'Documents requested', performedBy: 'Rahul Sharma' },
        { status: 'DOCUMENTS_RECEIVED', timestamp: '2024-07-08T15:00:00Z', note: 'All docs verified', performedBy: 'Rahul Sharma' },
        { status: 'SUBMITTED', timestamp: '2024-07-10T10:00:00Z', note: 'Submitted to NHAI', performedBy: 'Rahul Sharma' },
        { status: 'PROCESSING', timestamp: '2024-07-12T09:00:00Z', note: 'Under processing', performedBy: 'system' },
        { status: 'APPROVED', timestamp: '2024-07-18T11:00:00Z', note: 'Bond approved and allocated', performedBy: 'Rahul Sharma' },
        { status: 'COMPLETED', timestamp: '2024-07-20T10:00:00Z', note: 'Bond certificate issued', performedBy: 'Rahul Sharma' },
        { status: 'RENEWAL_SCHEDULED', timestamp: '2024-07-20T10:01:00Z', note: 'Renewal automatically scheduled', performedBy: 'system' },
      ],
      createdAt: '2024-07-01T09:00:00Z', updatedAt: '2024-07-20T10:01:00Z'
    },
    {
      id: 'a4', customerId: 'c4', staffId: 's2', productId: 'p2',
      status: 'DOCUMENTS_RECEIVED', pendingWith: 'Staff', nextAction: 'Verify all documents',
      notes: 'LIC Jeevan Anand for 20-year term',
      renewalDate: undefined,
      statusHistory: [
        { status: 'LEAD_CREATED', timestamp: '2024-08-20T09:00:00Z', note: 'Lead from referral', performedBy: 'Rahul Sharma' },
        { status: 'STAFF_ASSIGNED', timestamp: '2024-08-20T10:00:00Z', note: 'Assigned to Rahul Sharma', performedBy: 'Priya Patel' },
        { status: 'PRODUCT_SELECTED', timestamp: '2024-08-21T11:00:00Z', note: 'LIC Jeevan Anand selected', performedBy: 'Rahul Sharma' },
        { status: 'CUSTOMER_INTERESTED', timestamp: '2024-08-22T14:00:00Z', note: 'Confirmed', performedBy: 'Rahul Sharma' },
        { status: 'DOCUMENTS_REQUESTED', timestamp: '2024-08-23T10:00:00Z', note: 'PAN, Aadhaar, Photo, Medical Report requested', performedBy: 'Rahul Sharma' },
        { status: 'DOCUMENTS_RECEIVED', timestamp: '2024-09-01T15:00:00Z', note: 'All documents uploaded by customer', performedBy: 'c4' },
      ],
      createdAt: '2024-08-20T09:00:00Z', updatedAt: '2024-09-01T15:00:00Z'
    },
    {
      id: 'a5', customerId: 'c5', staffId: 's3', productId: 'p6',
      status: 'APPROVED', pendingWith: 'Staff', nextAction: 'Mark as completed and schedule renewal',
      notes: 'Axis Bluechip SIP - ₹10,000/month',
      renewalDate: undefined,
      statusHistory: [
        { status: 'LEAD_CREATED', timestamp: '2024-08-01T09:00:00Z', note: 'Enquiry', performedBy: 'Priya Patel' },
        { status: 'STAFF_ASSIGNED', timestamp: '2024-08-01T10:00:00Z', note: 'Assigned', performedBy: 'Priya Patel' },
        { status: 'PRODUCT_SELECTED', timestamp: '2024-08-02T11:00:00Z', note: 'Axis Bluechip Fund selected', performedBy: 'Priya Patel' },
        { status: 'CUSTOMER_INTERESTED', timestamp: '2024-08-04T14:00:00Z', note: 'Confirmed', performedBy: 'Priya Patel' },
        { status: 'DOCUMENTS_REQUESTED', timestamp: '2024-08-05T10:00:00Z', note: 'Documents requested', performedBy: 'Priya Patel' },
        { status: 'DOCUMENTS_RECEIVED', timestamp: '2024-08-10T15:00:00Z', note: 'All docs received', performedBy: 'Priya Patel' },
        { status: 'SUBMITTED', timestamp: '2024-08-12T10:00:00Z', note: 'Submitted to Axis AMC', performedBy: 'Priya Patel' },
        { status: 'PROCESSING', timestamp: '2024-08-14T09:00:00Z', note: 'Processing', performedBy: 'system' },
        { status: 'APPROVED', timestamp: '2024-08-20T11:00:00Z', note: 'SIP approved and started', performedBy: 'Priya Patel' },
      ],
      createdAt: '2024-08-01T09:00:00Z', updatedAt: '2024-08-20T11:00:00Z'
    },
  ]
}

// ─── Documents ────────────────────────────────────────────────────────────────
export function seedDocuments(): Document[] {
  return [
    { id: 'd1', applicationId: 'a1', customerId: 'c1', name: 'PAN Card', docType: 'PAN', status: 'REQUESTED', requestedAt: '2024-09-05T10:00:00Z' },
    { id: 'd2', applicationId: 'a1', customerId: 'c1', name: 'Aadhaar Card', docType: 'Aadhaar', status: 'UPLOADED', fileName: 'aadhaar_raj.pdf', uploadedAt: '2024-09-06T14:00:00Z', requestedAt: '2024-09-05T10:00:00Z' },
    { id: 'd3', applicationId: 'a1', customerId: 'c1', name: 'Bank Statement', docType: 'Bank Statement', status: 'REQUESTED', requestedAt: '2024-09-05T10:00:00Z' },
    { id: 'd4', applicationId: 'a1', customerId: 'c1', name: 'Cancelled Cheque', docType: 'Cancelled Cheque', status: 'REJECTED', rejectionReason: 'Image is blurry, please re-upload', uploadedAt: '2024-09-06T15:00:00Z', reviewedAt: '2024-09-07T10:00:00Z', requestedAt: '2024-09-05T10:00:00Z' },
    { id: 'd5', applicationId: 'a2', customerId: 'c2', name: 'PAN Card', docType: 'PAN', status: 'VERIFIED', fileName: 'pan_sneha.pdf', uploadedAt: '2024-08-20T10:00:00Z', reviewedAt: '2024-08-21T09:00:00Z', requestedAt: '2024-08-18T10:00:00Z' },
    { id: 'd6', applicationId: 'a2', customerId: 'c2', name: 'Aadhaar Card', docType: 'Aadhaar', status: 'VERIFIED', fileName: 'aadhaar_sneha.pdf', uploadedAt: '2024-08-20T10:30:00Z', reviewedAt: '2024-08-21T09:00:00Z', requestedAt: '2024-08-18T10:00:00Z' },
    { id: 'd7', applicationId: 'a4', customerId: 'c4', name: 'PAN Card', docType: 'PAN', status: 'UPLOADED', fileName: 'pan_divya.pdf', uploadedAt: '2024-09-01T12:00:00Z', requestedAt: '2024-08-23T10:00:00Z' },
    { id: 'd8', applicationId: 'a4', customerId: 'c4', name: 'Aadhaar Card', docType: 'Aadhaar', status: 'UPLOADED', fileName: 'aadhaar_divya.pdf', uploadedAt: '2024-09-01T12:30:00Z', requestedAt: '2024-08-23T10:00:00Z' },
    { id: 'd9', applicationId: 'a4', customerId: 'c4', name: 'Photo', docType: 'Photo', status: 'UPLOADED', fileName: 'photo_divya.jpg', uploadedAt: '2024-09-01T13:00:00Z', requestedAt: '2024-08-23T10:00:00Z' },
    { id: 'd10', applicationId: 'a4', customerId: 'c4', name: 'Medical Report', docType: 'Medical Report', status: 'REQUESTED', requestedAt: '2024-08-23T10:00:00Z' },
  ]
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export function seedMessages(): Message[] {
  return [
    { id: 'm1', applicationId: 'a1', fromRole: 'staff', fromId: 's1', fromName: 'Amit Singh', content: 'Hello Raj! I\'ve requested the required documents. Please upload them at your earliest convenience through the customer portal.', createdAt: '2024-09-05T10:30:00Z' },
    { id: 'm2', applicationId: 'a1', fromRole: 'customer', fromId: 'c1', fromName: 'Raj Patil', content: 'Hi Amit, I\'ve uploaded my Aadhaar. Will upload the rest by tomorrow.', createdAt: '2024-09-06T18:00:00Z' },
    { id: 'm3', applicationId: 'a1', fromRole: 'staff', fromId: 's1', fromName: 'Amit Singh', content: 'Thanks Raj! I noticed your cancelled cheque image was blurry. Can you please re-upload a clearer version?', createdAt: '2024-09-07T10:30:00Z' },
    { id: 'm4', applicationId: 'a2', fromRole: 'staff', fromId: 's1', fromName: 'Amit Singh', content: 'Good news Sneha! Your health insurance application has been submitted to Star Health. They are processing it.', createdAt: '2024-08-24T11:00:00Z' },
    { id: 'm5', applicationId: 'a2', fromRole: 'customer', fromId: 'c2', fromName: 'Sneha Mehta', content: 'Great! How long will it take to get the policy?', createdAt: '2024-08-24T14:00:00Z' },
    { id: 'm6', applicationId: 'a2', fromRole: 'staff', fromId: 's1', fromName: 'Amit Singh', content: 'Typically 3-5 business days. You will receive the policy document on your email directly from Star Health.', createdAt: '2024-08-24T15:30:00Z' },
  ]
}

// ─── Renewals ─────────────────────────────────────────────────────────────────
export function seedRenewals(): Renewal[] {
  const soon = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]
  }
  return [
    { id: 'r1', applicationId: 'a3', customerId: 'c3', productId: 'p7', renewalDate: soon(365), status: 'UPCOMING', createdAt: '2024-07-20T10:01:00Z' },
    { id: 'r2', applicationId: 'a2', customerId: 'c2', productId: 'p4', renewalDate: soon(15), status: 'REMINDER_SENT', reminderSentAt: '2024-08-25T09:00:00Z', createdAt: '2024-08-15T00:00:00Z' },
    { id: 'r3', applicationId: 'a5', customerId: 'c5', productId: 'p6', renewalDate: soon(5), status: 'CUSTOMER_CONTACTED', createdAt: '2024-08-20T00:00:00Z' },
    { id: 'r4', applicationId: 'a4', customerId: 'c4', productId: 'p2', renewalDate: soon(-7), status: 'UPCOMING', createdAt: '2024-08-01T00:00:00Z' },
  ]
}

// ─── Referrals ────────────────────────────────────────────────────────────────
export function seedReferrals(): Referral[] {
  return [
    { id: 'ref1', referrerId: 'c1', referredLeadId: 'l1', referredName: 'Suresh Pillai', status: 'CONVERTED', createdAt: '2024-09-01T09:00:00Z' },
    { id: 'ref2', referrerId: 'c3', referredLeadId: 'l6', referredName: 'Meera Thomas', status: 'LOST', createdAt: '2024-08-15T09:00:00Z' },
    { id: 'ref3', referrerId: 'c1', referredLeadId: 'l4', referredName: 'Preethi Iyer', status: 'PENDING', createdAt: '2024-09-01T14:00:00Z' },
  ]
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
export function seedRewards(): Reward[] {
  return [
    { id: 'rw1', customerId: 'c3', amount: 500, type: 'REFERRAL', status: 'PAID', description: 'Referral reward for Sanjay Mehta', createdAt: '2024-08-28T16:00:00Z' },
    { id: 'rw2', customerId: 'c1', amount: 500, type: 'REFERRAL', status: 'ELIGIBLE', description: 'Referral reward for Suresh Pillai (pending completion)', createdAt: '2024-09-01T09:00:00Z' },
  ]
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export function seedActivity(): ActivityLog[] {
  return [
    { id: 'act1', entity: 'application', entityId: 'a1', entityLabel: 'APP-a1', action: 'Status → Documents Requested', performedBy: 'Amit Singh', metadata: {}, createdAt: '2024-09-05T10:00:00Z' },
    { id: 'act2', entity: 'document', entityId: 'd2', entityLabel: 'Aadhaar - Raj Patil', action: 'Document Uploaded', performedBy: 'Raj Patil', metadata: {}, createdAt: '2024-09-06T14:00:00Z' },
    { id: 'act3', entity: 'document', entityId: 'd4', entityLabel: 'Cancelled Cheque - Raj Patil', action: 'Document Rejected', performedBy: 'Amit Singh', metadata: { reason: 'Image blurry' }, createdAt: '2024-09-07T10:00:00Z' },
    { id: 'act4', entity: 'application', entityId: 'a2', entityLabel: 'APP-a2', action: 'Status → Processing', performedBy: 'system', metadata: {}, createdAt: '2024-08-26T09:00:00Z' },
    { id: 'act5', entity: 'customer', entityId: 'c4', entityLabel: 'Divya Nair', action: 'Customer Created', performedBy: 'Rahul Sharma', metadata: {}, createdAt: '2024-07-20T00:00:00Z' },
    { id: 'act6', entity: 'renewal', entityId: 'r2', entityLabel: 'Star Health - Sneha Mehta', action: 'Reminder Sent', performedBy: 'Amit Singh', metadata: {}, createdAt: '2024-08-25T09:00:00Z' },
    { id: 'act7', entity: 'referral', entityId: 'ref1', entityLabel: 'Raj Patil → Suresh Pillai', action: 'Lead Converted', performedBy: 'system', metadata: {}, createdAt: '2024-08-28T16:00:00Z' },
    { id: 'act8', entity: 'application', entityId: 'a3', entityLabel: 'APP-a3', action: 'Status → Completed', performedBy: 'Rahul Sharma', metadata: {}, createdAt: '2024-07-20T10:00:00Z' },
  ]
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function seedNotifications(): Notification[] {
  return [
    { id: 'n1', title: 'Document Rejected', body: 'Cancelled cheque from Raj Patil was rejected.', type: 'document', linkTo: '/applications/a1', read: false, createdAt: '2024-09-07T10:00:00Z' },
    { id: 'n2', title: 'Application Processing', body: 'Sneha Mehta\'s health insurance is being processed.', type: 'application', linkTo: '/applications/a2', read: false, createdAt: '2024-08-26T09:00:00Z' },
    { id: 'n3', title: 'Renewal Upcoming', body: 'Star Health policy for Sneha Mehta renews in 15 days.', type: 'renewal', linkTo: '/renewals', read: true, createdAt: '2024-08-25T09:00:00Z' },
  ]
}

// ─── Reward Rules ─────────────────────────────────────────────────────────────
export function seedRewardRules(): RewardRule[] {
  return [
    { id: 'rr1', type: 'REFERRAL', amountPerReferral: 500, enabled: true },
    { id: 'rr2', type: 'RENEWAL_BONUS', amountPerReferral: 250, enabled: false },
  ]
}

export function seedDistributionHistory(): LeadDistributionRecord[] {
  const ago = (mins: number) => new Date(Date.now() - mins * 60000).toISOString()
  return [
    { id: 'd1', leadId: 'l5', leadName: 'Akash Kulkarni', productInterest: 'Demat Account', assignedToId: 's3', assignedToName: 'Vivek Shah', method: 'AUTO', status: 'ACCEPTED', assignedAt: ago(18) },
    { id: 'd2', leadId: 'l2', leadName: 'Meera Shah', productInterest: 'Health Insurance', assignedToId: 's2', assignedToName: 'Priya Shah', method: 'AUTO', status: 'CONTACT_PENDING', assignedAt: ago(32) },
    { id: 'd3', leadId: 'l4', leadName: 'Rohan Patil', productInterest: 'Mutual Fund', assignedToId: 's1', assignedToName: 'Rahul Mehta', method: 'MANUAL', status: 'ACCEPTED', assignedAt: ago(65) },
  ]
}
