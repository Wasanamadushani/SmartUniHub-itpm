const fs = require('fs');
const path = require('path');

// Files that need fixing
const filesToFix = [
  'src/pages/StudentFinesPage.jsx',
  'src/pages/RiderDashboardPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/EventStallRequestPage.jsx',
  'src/pages/EventsPage.jsx',
  'src/pages/EventsCalendarPage.jsx',
  'src/pages/EventPaymentPage.jsx',
  'src/pages/EventMemoriesPage.jsx',
  'src/pages/EventDetailsPage.jsx',
  'src/pages/DriverDashboardPage.jsx',
  'src/pages/CreateEventPage.jsx',
  'src/pages/BookEventPage.jsx',
  'src/pages/AdminStudyAreaPage.jsx',
  'src/pages/AdminEventsPage.jsx',
  'src/pages/AdminPage.jsx',
  'src/pages/BecomeDriverPage.jsx',
];

console.log('🔧 Fixing API paths in frontend files...\n');

let totalFixed = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix patterns like apiRequest('/users/...') to apiRequest('/api/users/...')
  // But don't fix if it already has /api
  content = content.replace(/apiRequest\(\s*(['"`])\/(?!api\/)/g, "apiRequest($1/api/");
  
  // Fix template literals like apiRequest(`/users/${id}`) to apiRequest(`/api/users/${id}`)
  content = content.replace(/apiRequest\(\s*`\/(?!api\/)/g, "apiRequest(`/api/");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`✓  Already correct: ${file}`);
  }
});

console.log(`\n🎉 Done! Fixed ${totalFixed} file(s).`);
console.log('\n📝 Next steps:');
console.log('1. Restart frontend: npm run dev');
console.log('2. Refresh browser: Ctrl+Shift+R');
