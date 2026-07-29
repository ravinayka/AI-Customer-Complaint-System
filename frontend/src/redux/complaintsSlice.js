import { createSlice } from '@reduxjs/toolkit';

const initialComplaints = [
  {
    key: '1',
    id: 'CMP-0021',
    product: 'Paracetamol 500mg',
    batch: 'PR500-2401',
    customer: 'City Pharmacy Group',
    risk: 'Medium',
    status: 'In Review',
    date: '2026-07-28',
    mfgDate: '2026-01-10',
    expDate: '2028-01-10',
    category: 'Packaging Damage',
    description: 'Packaging discoloration observed on the outer seal of Batch PR500-2401. Box is structurally sound but label prints appear faded.',
    reporter: 'Dr. Alice Vance',
    contact: 'alice.vance@citypharmacy.com',
    qty: 500
  },
  {
    key: '2',
    id: 'CMP-0022',
    product: 'Amoxicillin Capsules',
    batch: 'AMX250-2311',
    customer: 'Metro Health Clinic',
    risk: 'Critical',
    status: 'Open',
    date: '2026-07-27',
    mfgDate: '2025-11-15',
    expDate: '2027-11-15',
    category: 'Adverse Reaction',
    description: 'Patient reported gastrointestinal discomfort and mild skin rash after taking capsules from blister pack. Suspected thermal degradation during storage/transport.',
    reporter: 'Nurse Jack Thompson',
    contact: 'j.thompson@metrohealth.org',
    qty: 120
  },
  {
    key: '3',
    id: 'CMP-0023',
    product: 'Vitamin C Tablets',
    batch: 'VTC100-2405',
    customer: 'Wellness Center Retail',
    risk: 'Low',
    status: 'Closed',
    date: '2026-07-25',
    mfgDate: '2026-05-20',
    expDate: '2028-05-20',
    category: 'Quality Defect',
    description: 'Customer returned bottle due to missing desiccant pouch inside. No visible product deterioration or defects.',
    reporter: 'Mark Henderson',
    contact: 'm.henderson@wellnesscenter.com',
    qty: 15
  },
  {
    key: '4',
    id: 'CMP-0024',
    product: 'Ibuprofen Tablets',
    batch: 'IBP400-2398',
    customer: 'Apex Distributors',
    risk: 'High',
    status: 'In Review',
    date: '2026-07-24',
    mfgDate: null,
    expDate: '2027-09-30',
    category: 'Quality Defect',
    description: 'Cracked tablets discovered in multiple bottles of the batch. Potential issue with compression pressure in manufacturing press or binder concentration.',
    reporter: 'QC Lead Bob Roberts',
    contact: 'b.roberts@apexdist.com',
    qty: 1000
  },
  {
    key: '5',
    id: 'CMP-0025',
    product: 'Metformin 500mg',
    batch: 'MET500-2402',
    customer: 'Valley Pharmacy',
    risk: 'Medium',
    status: 'Open',
    date: '2026-07-23',
    mfgDate: '2026-02-12',
    expDate: '2028-02-12',
    category: 'Quality Defect',
    description: 'Odd smell (fishy odor) reported upon opening the bulk bottle. Requesting chemical analysis of the tablet coating agent.',
    reporter: 'Pharmacist Chloe Yang',
    contact: 'chloe.y@valleyrx.com',
    qty: 250
  },
  {
    key: '6',
    id: 'CMP-0026',
    product: 'Ibuprofen Tablets',
    batch: '',
    customer: 'Care Pharmacy',
    risk: 'High',
    status: 'Open',
    date: '2026-07-29',
    mfgDate: null,
    expDate: null,
    category: 'Quality Defect',
    description: 'Bad tablets.',
    reporter: 'Dr. John Smith',
    contact: 'jsmith@carepharmacy.org',
    qty: 50
  }
];

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    list: initialComplaints,
    chatMessages: [
      {
        id: '1',
        sender: 'assistant',
        text: "Hello! I am your AI Quality Assurance Copilot. Paste complaint narratives, log details, or upload documents (PDF, DOCX, TXT) and I'll extract parameters and triage them using LangGraph & Groq."
      }
    ],
    isExtracting: false,
    extractionProgress: 0,
    extractionSteps: [],
    currentStepIndex: -1,
    extractedResult: null
  },
  reducers: {
    addComplaint: (state, action) => {
      state.list = [action.payload, ...state.list];
    },
    updateComplaint: (state, action) => {
      state.list = state.list.map(c => 
        c.id === action.payload.id ? { ...c, ...action.payload.changes } : c
      );
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    setExtractingStatus: (state, action) => {
      state.isExtracting = action.payload;
    },
    setExtractionProgress: (state, action) => {
      state.extractionProgress = action.payload;
    },
    setExtractionResult: (state, action) => {
      state.extractedResult = action.payload;
    },
    updateExtractedField: (state, action) => {
      if (state.extractedResult && state.extractedResult.extractedData) {
        const { field, value } = action.payload;
        state.extractedResult.extractedData[field] = value;
        // Boost confidence score to 1.0 since user manually corrected it
        if (state.extractedResult.confidenceScores) {
          state.extractedResult.confidenceScores[field] = 1.0;
        }
      }
    },
    setExtractionSteps: (state, action) => {
      state.extractionSteps = action.payload;
    },
    setCurrentStepIndex: (state, action) => {
      state.currentStepIndex = action.payload;
    },
    resetExtractionState: (state) => {
      state.extractionProgress = 0;
      state.extractionSteps = [];
      state.currentStepIndex = -1;
      state.extractedResult = null;
    }
  }
});

export const {
  addComplaint,
  updateComplaint,
  addChatMessage,
  setExtractingStatus,
  setExtractionProgress,
  setExtractionResult,
  updateExtractedField,
  setExtractionSteps,
  setCurrentStepIndex,
  resetExtractionState
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
