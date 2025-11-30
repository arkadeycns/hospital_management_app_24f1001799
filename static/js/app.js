const { createApp, ref, onMounted, computed } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// --- Components ---

const Login = {
    template: `
    <div class="row justify-content-center align-items-center" style="min-height: 60vh;">
        <div class="col-md-5 col-lg-4">
            <div class="glass-panel">
                <h2 class="text-center mb-4">Welcome Back</h2>
                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" v-model="username" required placeholder="Enter your username">
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" v-model="password" required placeholder="Enter your password">
                    </div>
                    <button type="submit" class="btn btn-primary w-100 mb-3">Sign In</button>
                    <p class="text-center text-muted small">
                        Don't have an account? <router-link to="/register" class="text-primary fw-bold text-decoration-none">Register</router-link>
                    </p>
                    <div v-if="error" class="alert alert-danger mt-3 py-2 text-center small">{{ error }}</div>
                </form>
            </div>
        </div>
    </div>
    `,
    setup() {
        const username = ref('');
        const password = ref('');
        const error = ref('');
        const router = VueRouter.useRouter();

        const login = async () => {
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username.value, password: password.value })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('username', data.username);
                    window.dispatchEvent(new Event('auth-change')); // Notify app

                    if (data.role === 'admin') router.push('/admin');
                    else if (data.role === 'doctor') router.push('/doctor');
                    else router.push('/patient');
                } else {
                    error.value = data.msg;
                }
            } catch (e) {
                error.value = "Login failed";
            }
        };
        return { username, password, error, login };
    }
};

const Register = {
    template: `
    <div class="row justify-content-center align-items-center" style="min-height: 60vh;">
        <div class="col-md-5 col-lg-4">
            <div class="glass-panel">
                <h2 class="text-center mb-4">Create Account</h2>
                <form @submit.prevent="register">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" v-model="username" required placeholder="Choose a username">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" v-model="email" required placeholder="Enter your email">
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" v-model="password" required placeholder="Choose a password">
                    </div>
                    <button type="submit" class="btn btn-primary w-100 mb-3">Register</button>
                    <p class="text-center text-muted small">
                        Already have an account? <router-link to="/login" class="text-primary fw-bold text-decoration-none">Login</router-link>
                    </p>
                    <div v-if="error" class="alert alert-danger mt-3 py-2 text-center small">{{ error }}</div>
                </form>
            </div>
        </div>
    </div>
    `,
    setup() {
        const username = ref('');
        const email = ref('');
        const password = ref('');
        const error = ref('');
        const router = VueRouter.useRouter();

        const register = async () => {
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
                });
                const data = await res.json();
                if (res.ok) {
                    router.push('/login');
                } else {
                    error.value = data.msg;
                }
            } catch (e) {
                error.value = "Registration failed";
            }
        };
        return { username, email, password, error, register };
    }
};

const AdminDashboard = {
    template: `
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">Admin Dashboard</h1>
            <span class="badge bg-primary">Administrator</span>
        </div>

        <!-- Navigation Tabs -->
        <div class="glass-panel mb-4">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
                        Overview
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'doctors' }" @click="activeTab = 'doctors'">
                        Manage Doctors
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'patients' }" @click="activeTab = 'patients'">
                        Manage Patients
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'appointments' }" @click="activeTab = 'appointments'">
                        All Appointments
                    </button>
                </li>
            </ul>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        
        <div v-else>
            <!-- Dashboard Overview Tab -->
            <div v-if="activeTab === 'dashboard'">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="glass-panel text-center">
                            <h2 class="mb-2">{{ stats.total_doctors || 0 }}</h2>
                            <p class="text-muted mb-0">Total Doctors</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-panel text-center">
                            <h2 class="mb-2">{{ stats.total_patients || 0 }}</h2>
                            <p class="text-muted mb-0">Total Patients</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-panel text-center">
                            <h2 class="mb-2">{{ stats.total_appointments || 0 }}</h2>
                            <p class="text-muted mb-0">All Appointments</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-panel text-center">
                            <h2 class="mb-2">{{ stats.today_appointments || 0 }}</h2>
                            <p class="text-muted mb-0">Today's Appointments</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Manage Doctors Tab -->
            <div v-if="activeTab === 'doctors'" class="glass-panel">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="mb-0">Doctors Directory</h3>
                    <button @click="showAddDoctorModal = true" class="btn btn-primary">+ Add Doctor</button>
                </div>
                
                <div class="mb-3">
                    <input type="text" class="form-control" v-model="doctorSearch" placeholder="Search doctors by name or specialization...">
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Specialization</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="doc in filteredDoctors" :key="doc.id">
                                <td>#{{ doc.id }}</td>
                                <td class="fw-bold">{{ doc.username }}</td>
                                <td>{{ doc.email }}</td>
                                <td><span class="badge bg-info">{{ doc.specialization }}</span></td>
                                <td>
                                    <button @click="editDoctor(doc)" class="btn btn-sm btn-outline-warning me-2">Edit</button>
                                    <button @click="deleteDoctor(doc.id)" class="btn btn-sm btn-outline-danger">Remove</button>
                                </td>
                            </tr>
                            <tr v-if="filteredDoctors.length === 0">
                                <td colspan="5" class="text-center text-muted py-4">No doctors found matching your search.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Manage Patients Tab -->
            <div v-if="activeTab === 'patients'" class="glass-panel">
                <h3 class="mb-4">Patient Registry</h3>
                
                <div class="mb-3">
                    <input type="text" class="form-control" v-model="patientSearch" placeholder="Search patients by name or email...">
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="patient in filteredPatients" :key="patient.id">
                                <td>#{{ patient.id }}</td>
                                <td class="fw-bold">{{ patient.username }}</td>
                                <td>{{ patient.email }}</td>
                                <td>{{ patient.address || '-' }}</td>
                                <td>
                                    <button @click="deletePatient(patient.id)" class="btn btn-sm btn-outline-danger">Remove</button>
                                </td>
                            </tr>
                            <tr v-if="filteredPatients.length === 0">
                                <td colspan="5" class="text-center text-muted py-4">No patients found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Appointments Tab -->
            <div v-if="activeTab === 'appointments'" class="glass-panel">
                <h3 class="mb-4">System Appointments Log</h3>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Doctor</th>
                                <th>Patient</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="appt in appointments" :key="appt.id">
                                <td>#{{ appt.id }}</td>
                                <td>{{ appt.doctor_name }}</td>
                                <td>{{ appt.patient_name }}</td>
                                <td>{{ new Date(appt.date_time).toLocaleString() }}</td>
                                <td>
                                    <span class="badge" :class="{
                                        'bg-success': appt.status === 'Completed',
                                        'bg-warning': appt.status === 'Booked',
                                        'bg-danger': appt.status === 'Cancelled'
                                    }">{{ appt.status }}</span>
                                </td>
                            </tr>
                            <tr v-if="appointments.length === 0">
                                <td colspan="5" class="text-center text-muted py-4">No appointments recorded yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add Doctor Modal -->
        <div v-if="showAddDoctorModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div class="glass-panel" style="width: 90%; max-width: 500px;">
                <h3 class="mb-4">Add New Doctor</h3>
                <form @submit.prevent="addDoctor">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" v-model="newDoc.username" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" v-model="newDoc.email" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" v-model="newDoc.password" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Specialization</label>
                        <input type="text" class="form-control" v-model="newDoc.specialization" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary flex-grow-1">Add Doctor</button>
                        <button type="button" @click="showAddDoctorModal = false" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Doctor Modal -->
        <div v-if="editingDoctor" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div class="glass-panel" style="width: 90%; max-width: 500px;">
                <h3 class="mb-4">Edit Doctor</h3>
                <form @submit.prevent="updateDoctor">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" v-model="editingDoctor.username" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" v-model="editingDoctor.email" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Specialization</label>
                        <input type="text" class="form-control" v-model="editingDoctor.specialization" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-success flex-grow-1">Save Changes</button>
                        <button type="button" @click="editingDoctor = null" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

    </div>
    `,
    setup() {
        const doctors = ref([]);
        const patients = ref([]);
        const appointments = ref([]);
        const stats = ref({});

        const activeTab = ref('dashboard');
        const doctorSearch = ref('');
        const patientSearch = ref('');

        const newDoc = ref({ username: '', email: '', password: '', specialization: '' });
        const editingDoctor = ref(null);
        const showAddDoctorModal = ref(false);

        const token = localStorage.getItem('token');
        const error = ref('');
        const loading = ref(false);

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) stats.value = await res.json();
            } catch (e) { console.error(e); }
        };

        const fetchDoctors = async () => {
            try {
                const res = await fetch('/api/admin/doctors', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) doctors.value = await res.json();
            } catch (e) { console.error(e); }
        };

        const fetchPatients = async () => {
            try {
                const res = await fetch('/api/admin/patients', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) patients.value = await res.json();
            } catch (e) { console.error(e); }
        };

        const fetchAppointments = async () => {
            try {
                const res = await fetch('/api/admin/appointments', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) appointments.value = await res.json();
            } catch (e) { console.error(e); }
        };

        const filteredDoctors = computed(() => {
            if (!doctorSearch.value) return doctors.value;
            const term = doctorSearch.value.toLowerCase();
            return doctors.value.filter(d =>
                d.username.toLowerCase().includes(term) ||
                d.specialization.toLowerCase().includes(term)
            );
        });

        const filteredPatients = computed(() => {
            if (!patientSearch.value) return patients.value;
            const term = patientSearch.value.toLowerCase();
            return patients.value.filter(p =>
                p.username.toLowerCase().includes(term) ||
                p.email.toLowerCase().includes(term)
            );
        });

        const addDoctor = async () => {
            try {
                const res = await fetch('/api/admin/doctors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(newDoc.value)
                });
                if (res.ok) {
                    newDoc.value = { username: '', email: '', password: '', specialization: '' };
                    showAddDoctorModal.value = false;
                    fetchDoctors();
                    fetchStats();
                    alert("Doctor added successfully!");
                } else {
                    const data = await res.json();
                    alert(data.msg || "Error adding doctor");
                }
            } catch (e) { alert(e.message); }
        };

        const editDoctor = (doc) => {
            editingDoctor.value = { ...doc };
        };

        const updateDoctor = async () => {
            try {
                const res = await fetch('/api/admin/doctor/' + editingDoctor.value.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(editingDoctor.value)
                });
                if (res.ok) {
                    editingDoctor.value = null;
                    fetchDoctors();
                    alert("Doctor updated successfully!");
                } else {
                    alert("Error updating doctor");
                }
            } catch (e) { alert(e.message); }
        };

        const deleteDoctor = async (id) => {
            if (!confirm('Are you sure you want to remove this doctor? This cannot be undone.')) return;
            const res = await fetch('/api/admin/doctor/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                fetchDoctors();
                fetchStats();
            } else {
                const data = await res.json();
                alert(data.msg || "Error deleting doctor");
            }
        };

        const deletePatient = async (id) => {
            if (!confirm('Are you sure you want to remove this patient? This will delete all their appointments.')) return;
            const res = await fetch('/api/admin/patient/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                fetchPatients();
                fetchStats();
            } else {
                const data = await res.json();
                alert(data.msg || "Error deleting patient");
            }
        };

        onMounted(() => {
            fetchStats();
            fetchDoctors();
            fetchPatients();
            fetchAppointments();
        });

        return {
            doctors, patients, appointments, stats,
            activeTab, doctorSearch, patientSearch, filteredDoctors, filteredPatients,
            newDoc, editingDoctor, showAddDoctorModal,
            addDoctor, editDoctor, updateDoctor, deleteDoctor, deletePatient,
            error, loading
        };
    }
};

const DoctorDashboard = {
    template: `
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">Doctor Portal</h1>
            <span class="badge bg-primary">Medical Staff</span>
        </div>

        <!-- View Tabs -->
        <div class="glass-panel mb-4">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'appointments' }" 
                            @click="activeTab = 'appointments'">
                        All Appointments
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'upcoming' }" 
                            @click="activeTab = 'upcoming'; fetchUpcoming()">
                        Upcoming (7 Days)
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'patients' }" 
                            @click="activeTab = 'patients'; fetchPatients()">
                        My Patients
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'availability' }" 
                            @click="activeTab = 'availability'">
                        Availability
                    </button>
                </li>
            </ul>
        </div>

        <!-- All Appointments Tab -->
        <div v-if="activeTab === 'appointments'" class="glass-panel">
            <h3 class="mb-4">My Schedule</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Status</th>
                            <th>Diagnosis</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="appt in appointments" :key="appt.id">
                            <td>{{ new Date(appt.date_time).toLocaleString() }}</td>
                            <td>{{ appt.patient_name }}</td>
                            <td>
                                <span class="badge" :class="{
                                    'bg-success': appt.status === 'Completed',
                                    'bg-warning': appt.status === 'Booked',
                                    'bg-danger': appt.status === 'Cancelled'
                                }">{{ appt.status }}</span>
                            </td>
                            <td>{{ appt.diagnosis || '-' }}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" @click="editAppt(appt)">Manage</button>
                            </td>
                        </tr>
                        <tr v-if="appointments.length === 0">
                            <td colspan="5" class="text-center text-muted py-4">No appointments assigned.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="editingAppt" class="mt-4 p-4 glass-panel border border-primary">
                <h4 class="mb-3">Update Appointment #{{ editingAppt.id }}</h4>
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Status</label>
                        <select class="form-select" v-model="editingAppt.status">
                            <option>Booked</option>
                            <option>Completed</option>
                            <option>Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">Diagnosis</label>
                        <textarea class="form-control" v-model="editingAppt.diagnosis" rows="2"></textarea>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">Prescription</label>
                        <textarea class="form-control" v-model="editingAppt.prescription" rows="2"></textarea>
                    </div>
                    <div class="col-12 d-flex gap-2">
                        <button class="btn btn-success" @click="saveAppt">Save Changes</button>
                        <button class="btn btn-secondary" @click="editingAppt = null">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upcoming Appointments Tab -->
        <div v-if="activeTab === 'upcoming'" class="glass-panel">
            <h3 class="mb-4">Upcoming Appointments (Next 7 Days)</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="appt in upcomingAppointments" :key="appt.id">
                            <td>{{ new Date(appt.date_time).toLocaleString() }}</td>
                            <td>{{ appt.patient_name }}</td>
                            <td>
                                <span class="badge bg-warning">{{ appt.status }}</span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" @click="editAppt(appt); activeTab = 'appointments'">Manage</button>
                            </td>
                        </tr>
                        <tr v-if="upcomingAppointments.length === 0">
                            <td colspan="4" class="text-center text-muted py-4">No upcoming appointments in the next 7 days.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- My Patients Tab -->
        <div v-if="activeTab === 'patients'" class="glass-panel">
            <h3 class="mb-4">My Patients</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Patient Name</th>
                            <th>Email</th>
                            <th>Total Appointments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="patient in myPatients" :key="patient.id">
                            <td>#{{ patient.id }}</td>
                            <td class="fw-bold">{{ patient.username }}</td>
                            <td>{{ patient.email }}</td>
                            <td>
                                <span class="badge bg-info">{{ patient.total_appointments }}</span>
                            </td>
                        </tr>
                        <tr v-if="myPatients.length === 0">
                            <td colspan="4" class="text-center text-muted py-4">No patients assigned yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Availability Tab -->
        <div v-if="activeTab === 'availability'" class="glass-panel">
            <h3 class="mb-4">Set My Availability (Next 7 Days)</h3>
            <p class="text-muted">Click on time slots to mark when you're available</p>
            
            <div class="row">
                <div v-for="day in availabilityDays" :key="day.date" class="col-md-6 mb-3">
                    <div class="card bg-dark text-white border border-secondary">
                        <div class="card-header bg-primary">
                            <h5 class="mb-0">{{ day.dayName }} - {{ day.dateStr }}</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex flex-wrap gap-2">
                                <button 
                                    v-for="slot in timeSlots" 
                                    :key="slot"
                                    @click="toggleSlot(day.date, slot)"
                                    class="btn btn-sm"
                                    :class="isSlotSelected(day.date, slot) ? 'btn-success' : 'btn-outline-secondary'">
                                    {{ slot }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <button @click="saveAvailability" class="btn btn-primary btn-lg">
                    💾 Save Availability
                </button>
                <span v-if="availabilitySaved" class="text-success ms-3 fw-bold">
                    ✓ Saved successfully!
                </span>
            </div>
        </div>
    </div>
    `,
    setup() {
        const appointments = ref([]);
        const upcomingAppointments = ref([]);
        const myPatients = ref([]);
        const editingAppt = ref(null);
        const activeTab = ref('appointments');
        const availability = ref({});
        const availabilityDays = ref([]);
        const availabilitySaved = ref(false);
        const token = localStorage.getItem('token');

        const timeSlots = [
            '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00'
        ];

        const fetchAppointments = async () => {
            const res = await fetch('/api/doctor/appointments', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) appointments.value = await res.json();
        };

        const fetchUpcoming = async () => {
            const res = await fetch('/api/doctor/appointments/upcoming', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) upcomingAppointments.value = await res.json();
        };

        const fetchPatients = async () => {
            const res = await fetch('/api/doctor/patients', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) myPatients.value = await res.json();
        };

        const editAppt = (appt) => {
            editingAppt.value = { ...appt };
        };

        const saveAppt = async () => {
            const res = await fetch('/api/doctor/appointment/' + editingAppt.value.id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(editingAppt.value)
            });
            if (res.ok) {
                alert('Appointment updated successfully!');
                editingAppt.value = null;
                fetchAppointments();
                if (activeTab.value === 'upcoming') fetchUpcoming();
            }
        };

        // Availability Logic
        const generateAvailabilityDays = () => {
            const days = [];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = dayNames[date.getDay()];

                days.push({
                    date: dateStr,
                    dayName: dayName,
                    dateStr: date.toLocaleDateString()
                });
            }
            availabilityDays.value = days;
        };

        const isSlotSelected = (date, slot) => {
            return availability.value[date]?.includes(slot) || false;
        };

        const toggleSlot = (date, slot) => {
            if (!availability.value[date]) {
                availability.value[date] = [];
            }
            const index = availability.value[date].indexOf(slot);
            if (index > -1) {
                availability.value[date].splice(index, 1);
            } else {
                availability.value[date].push(slot);
            }
            availabilitySaved.value = false;
        };

        const fetchAvailability = async () => {
            try {
                const res = await fetch('/api/doctor/availability', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    availability.value = await res.json();
                }
            } catch (e) {
                console.error(e);
            }
        };

        const saveAvailability = async () => {
            try {
                const res = await fetch('/api/doctor/availability', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(availability.value)
                });

                if (res.ok) {
                    availabilitySaved.value = true;
                    alert('Availability saved successfully!');
                    setTimeout(() => availabilitySaved.value = false, 3000);
                }
            } catch (e) {
                alert('Error saving availability');
            }
        };

        onMounted(() => {
            fetchAppointments();
            generateAvailabilityDays();
            fetchAvailability();
        });

        return {
            appointments,
            upcomingAppointments,
            myPatients,
            editingAppt,
            activeTab,
            editAppt,
            saveAppt,
            fetchUpcoming,
            fetchPatients,
            // Availability
            availability,
            availabilityDays,
            availabilitySaved,
            timeSlots,
            isSlotSelected,
            toggleSlot,
            saveAvailability
        };
    }
};

const PatientDashboard = {
    template: `
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">Patient Portal</h1>
            <span class="badge bg-primary">Patient</span>
        </div>

        <!-- Navigation Tabs -->
        <div class="glass-panel mb-4">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'book' }" @click="activeTab = 'book'">
                        Book Appointment
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'appointments' }" @click="activeTab = 'appointments'">
                        My Appointments
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
                        My Profile
                    </button>
                </li>
            </ul>
        </div>
        
        <!-- Book Appointment Tab -->
        <div v-if="activeTab === 'book'">
            <!-- Specialization Filter -->
            <div class="glass-panel mb-4">
                <h5 class="mb-3">Filter by Specialization</h5>
                <div class="d-flex flex-wrap gap-2">
                    <button @click="selectedSpec = ''" 
                            class="btn btn-sm" 
                            :class="selectedSpec === '' ? 'btn-primary' : 'btn-outline-secondary'">
                        All
                    </button>
                    <button v-for="spec in specializations" :key="spec" 
                            @click="selectedSpec = spec"
                            class="btn btn-sm"
                            :class="selectedSpec === spec ? 'btn-primary' : 'btn-outline-secondary'">
                        {{ spec }}
                    </button>
                </div>
            </div>

            <!-- Doctors List -->
            <div class="row g-4">
                <div v-for="doc in filteredDoctors" :key="doc.id" class="col-md-6 col-lg-4">
                    <div class="glass-panel h-100 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="mb-1">Dr. {{ doc.name }}</h5>
                                <span class="badge bg-info">{{ doc.specialization }}</span>
                            </div>
                            <div class="bg-primary rounded-circle p-2">
                                <i class="bi bi-person-fill text-white"></i>
                            </div>
                        </div>
                        <p class="text-muted small mb-3">Experienced specialist in {{ doc.specialization }}.</p>
                        <div class="mt-auto">
                            <button @click="viewDoctorAvailability(doc)" class="btn btn-outline-primary w-100 mb-2">
                                View Availability & Profile
                            </button>
                            <button @click="selectDoctorForBooking(doc)" class="btn btn-primary w-100">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Doctor Availability Modal -->
        <div v-if="showDoctorModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div class="glass-panel" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3>Dr. {{ selectedDoctorProfile.name }}</h3>
                    <button @click="showDoctorModal = false" class="btn btn-sm btn-secondary">Close</button>
                </div>
                
                <div class="mb-4">
                    <h5>Availability (Next 7 Days)</h5>
                    <div v-if="Object.keys(doctorAvailability).length === 0" class="text-muted">
                        No specific availability set. Please check booking form for open slots.
                    </div>
                    <div v-else class="d-flex flex-wrap gap-2">
                        <div v-for="(slots, date) in doctorAvailability" :key="date" class="border border-secondary p-2 rounded">
                            <div class="fw-bold mb-1">{{ new Date(date).toLocaleDateString() }}</div>
                            <div class="d-flex flex-wrap gap-1">
                                <span v-for="slot in slots" :key="slot" class="badge bg-success">{{ slot }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button @click="selectDoctorForBooking(selectedDoctorProfile); showDoctorModal = false" class="btn btn-primary w-100">
                    Proceed to Book
                </button>
            </div>
        </div>

        <!-- Booking Modal -->
        <div v-if="showBookingModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div class="glass-panel" style="width: 90%; max-width: 500px;">
                <h3 class="mb-4">Book Appointment</h3>
                <p>With <strong>Dr. {{ bookingDoctor.name }}</strong></p>
                <form @submit.prevent="book">
                    <div class="mb-4">
                        <label class="form-label">Preferred Date & Time</label>
                        <input type="datetime-local" class="form-control" v-model="dateTime" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary flex-grow-1">Confirm Booking</button>
                        <button type="button" @click="showBookingModal = false" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- My Appointments Tab -->
        <div v-if="activeTab === 'appointments'">
            <div class="glass-panel">
                <h3 class="mb-4">My Appointments</h3>
                
                <div v-if="appointments.length === 0" class="text-center py-5 text-muted">
                    No appointments found.
                </div>

                <div v-else class="list-group list-group-flush">
                    <div v-for="appt in appointments" :key="appt.id" class="list-group-item bg-transparent border-bottom border-secondary text-white py-3">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <h5 class="mb-1">Dr. {{ appt.doctor_name }}</h5>
                                <p class="mb-0 text-muted small">{{ new Date(appt.date_time).toLocaleString() }}</p>
                            </div>
                            <div class="col-md-3">
                                <span class="badge" :class="{
                                    'bg-success': appt.status === 'Completed',
                                    'bg-warning': appt.status === 'Booked',
                                    'bg-danger': appt.status === 'Cancelled'
                                }">{{ appt.status }}</span>
                            </div>
                            <div class="col-md-5">
                                <!-- Diagnosis & Prescription -->
                                <div v-if="appt.diagnosis || appt.prescription" class="mt-2 mt-md-0 p-2 bg-dark rounded border border-secondary">
                                    <div v-if="appt.diagnosis"><small class="text-info">Diagnosis:</small> {{ appt.diagnosis }}</div>
                                    <div v-if="appt.prescription"><small class="text-warning">Rx:</small> {{ appt.prescription }}</div>
                                </div>
                                
                                <!-- Actions -->
                                <div class="mt-2 text-end">
                                    <button v-if="appt.status === 'Booked'" @click="rescheduleAppt(appt)" class="btn btn-sm btn-outline-info me-2">Reschedule</button>
                                    <button v-if="appt.status === 'Booked'" @click="cancelAppt(appt.id)" class="btn btn-sm btn-outline-danger">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'">
            <div class="glass-panel" style="max-width: 600px; margin: 0 auto;">
                <h3 class="mb-4">My Profile</h3>
                <form @submit.prevent="updateProfile">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" v-model="profile.username" readonly disabled>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" v-model="profile.email" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" v-model="profile.address" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Update Profile</button>
                </form>
            </div>
        </div>

        <!-- Reschedule Modal -->
        <div v-if="reschedulingAppt" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div class="glass-panel" style="width: 90%; max-width: 500px;">
                <h3 class="mb-4">Reschedule Appointment</h3>
                <form @submit.prevent="confirmReschedule">
                    <div class="mb-4">
                        <label class="form-label">New Date & Time</label>
                        <input type="datetime-local" class="form-control" v-model="newDateTime" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary flex-grow-1">Confirm</button>
                        <button type="button" @click="reschedulingAppt = null" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

    </div>
    `,
    setup() {
        const doctors = ref([]);
        const specializations = ref([]);
        const appointments = ref([]);
        const profile = ref({ username: '', email: '', address: '' });

        const activeTab = ref('book');
        const selectedSpec = ref('');
        const dateTime = ref('');
        const newDateTime = ref('');

        const showDoctorModal = ref(false);
        const showBookingModal = ref(false);
        const selectedDoctorProfile = ref({});
        const doctorAvailability = ref({});
        const bookingDoctor = ref({});
        const reschedulingAppt = ref(null);

        const token = localStorage.getItem('token');

        const fetchData = async () => {
            // Fetch Doctors
            const docRes = await fetch('/api/patient/doctors');
            if (docRes.ok) doctors.value = await docRes.json();

            // Fetch Specializations
            const specRes = await fetch('/api/specializations');
            if (specRes.ok) specializations.value = await specRes.json();

            // Fetch Appointments
            const apptRes = await fetch('/api/patient/appointments', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (apptRes.ok) appointments.value = await apptRes.json();

            // Fetch Profile
            const profRes = await fetch('/api/patient/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (profRes.ok) profile.value = await profRes.json();
        };

        const filteredDoctors = computed(() => {
            if (!selectedSpec.value) return doctors.value;
            return doctors.value.filter(d => d.specialization === selectedSpec.value);
        });

        const viewDoctorAvailability = async (doc) => {
            selectedDoctorProfile.value = doc;
            // Fetch availability
            const res = await fetch(`/api/doctor/${doc.id}/availability`);
            if (res.ok) {
                doctorAvailability.value = await res.json();
            } else {
                doctorAvailability.value = {};
            }
            showDoctorModal.value = true;
        };

        const selectDoctorForBooking = (doc) => {
            bookingDoctor.value = doc;
            showBookingModal.value = true;
        };

        const book = async () => {
            const res = await fetch('/api/patient/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    doctor_id: bookingDoctor.value.id,
                    date_time: dateTime.value
                })
            });
            if (res.ok) {
                fetchData();
                alert('Appointment Booked Successfully!');
                showBookingModal.value = false;
                dateTime.value = '';
                activeTab.value = 'appointments';
            } else {
                const data = await res.json();
                alert(data.msg || 'Booking failed');
            }
        };

        const cancelAppt = async (id) => {
            if (!confirm('Are you sure you want to cancel this appointment?')) return;
            const res = await fetch('/api/patient/appointment/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) fetchData();
        };

        const rescheduleAppt = (appt) => {
            reschedulingAppt.value = appt;
            newDateTime.value = '';
        };

        const confirmReschedule = async () => {
            const res = await fetch('/api/patient/appointment/' + reschedulingAppt.value.id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    date_time: newDateTime.value
                })
            });
            if (res.ok) {
                alert('Appointment Rescheduled!');
                reschedulingAppt.value = null;
                fetchData();
            } else {
                const data = await res.json();
                alert(data.msg || 'Reschedule failed');
            }
        };

        const updateProfile = async () => {
            const res = await fetch('/api/patient/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(profile.value)
            });
            if (res.ok) alert('Profile updated successfully!');
        };

        onMounted(fetchData);

        return {
            doctors, specializations, appointments, profile,
            activeTab, selectedSpec, filteredDoctors,
            showDoctorModal, showBookingModal, selectedDoctorProfile, doctorAvailability, bookingDoctor,
            dateTime, newDateTime, reschedulingAppt,
            viewDoctorAvailability, selectDoctorForBooking, book, cancelAppt, rescheduleAppt, confirmReschedule, updateProfile
        };
    }
};

// --- Router & App ---

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/admin', component: AdminDashboard },
    { path: '/doctor', component: DoctorDashboard },
    { path: '/patient', component: PatientDashboard },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const app = createApp({
    setup() {
        const isAuthenticated = ref(!!localStorage.getItem('token'));
        const userRole = ref(localStorage.getItem('role'));
        const userName = ref(localStorage.getItem('username'));

        const updateAuth = () => {
            isAuthenticated.value = !!localStorage.getItem('token');
            userRole.value = localStorage.getItem('role');
            userName.value = localStorage.getItem('username');
        };

        window.addEventListener('auth-change', updateAuth);

        const logout = () => {
            localStorage.clear();
            updateAuth();
            router.push('/login');
        };

        // Computed property for template
        const isLoggedIn = computed(() => isAuthenticated.value);

        return { isAuthenticated, isLoggedIn, userRole, userName, logout };
    }
});

app.use(router);
app.mount('#app');
