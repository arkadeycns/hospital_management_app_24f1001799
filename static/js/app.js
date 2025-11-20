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

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        
        <div v-else>
            <!-- Statistics Cards -->
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

            <!-- Manage Doctors Section -->
            <div class="glass-panel">
                <h3 class="mb-4">Manage Doctors</h3>
                <form @submit.prevent="addDoctor" class="row g-3 mb-4">
                    <div class="col-md-3">
                        <input type="text" class="form-control" v-model="newDoc.username" placeholder="Username" required>
                    </div>
                    <div class="col-md-3">
                        <input type="email" class="form-control" v-model="newDoc.email" placeholder="Email" required>
                    </div>
                    <div class="col-md-3">
                        <input type="password" class="form-control" v-model="newDoc.password" placeholder="Password" required>
                    </div>
                    <div class="col-md-2">
                        <input type="text" class="form-control" v-model="newDoc.specialization" placeholder="Specialization" required>
                    </div>
                    <div class="col-md-1">
                        <button type="submit" class="btn btn-primary w-100">
                            <span class="fw-bold">+</span>
                        </button>
                    </div>
                </form>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Specialization</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="doc in doctors" :key="doc.id">
                                <td>#{{ doc.id }}</td>
                                <td class="fw-bold">{{ doc.username }}</td>
                                <td><span class="badge bg-secondary">{{ doc.specialization }}</span></td>
                                <td>
                                    <span :class="doc.is_approved ? 'badge bg-success' : 'badge bg-warning'">
                                        {{ doc.is_approved ? 'Active' : 'Pending' }}
                                    </span>
                                </td>
                                <td>
                                    <button @click="deleteDoctor(doc.id)" class="btn btn-sm btn-danger">Remove</button>
                                </td>
                            </tr>
                            <tr v-if="doctors.length === 0">
                                <td colspan="5" class="text-center text-muted py-4">No doctors found. Add one above.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Appointments Section -->
            <div class="glass-panel">
                <h3 class="mb-4">System Appointments</h3>
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
    </div>
    `,
    setup() {
        const doctors = ref([]);
        const appointments = ref([]);
        const stats = ref({});
        const newDoc = ref({ username: '', email: '', password: '', specialization: '' });
        const token = localStorage.getItem('token');
        const error = ref('');
        const loading = ref(false);

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    stats.value = await res.json();
                }
            } catch (e) {
                console.error('Error fetching stats:', e);
            }
        };

        const fetchDoctors = async () => {
            try {
                loading.value = true;
                const res = await fetch('/api/admin/doctors', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    doctors.value = await res.json();
                } else {
                    const data = await res.json();
                    error.value = "Failed to fetch doctors: " + (data.msg || res.statusText);
                }
            } catch (e) {
                error.value = "Error fetching doctors: " + e.message;
            } finally {
                loading.value = false;
            }
        };

        const fetchAppointments = async () => {
            try {
                const res = await fetch('/api/admin/appointments', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    appointments.value = await res.json();
                }
            } catch (e) {
                console.error(e);
            }
        };

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
                    fetchDoctors();
                    fetchStats(); // Refresh stats after adding doctor
                } else {
                    const data = await res.json();
                    alert(data.msg || "Error adding doctor");
                }
            } catch (e) {
                alert("Error: " + e.message);
            }
        };

        const deleteDoctor = async (id) => {
            if (!confirm('Are you sure?')) return;
            const res = await fetch('/api/admin/doctor/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                fetchDoctors();
                fetchStats(); // Refresh stats after deleting doctor
            }
        };

        onMounted(() => {
            fetchStats();
            fetchDoctors();
            fetchAppointments();
        });
        return { doctors, appointments, stats, newDoc, addDoctor, deleteDoctor, error, loading };
    }
};

const DoctorDashboard = {
    template: `
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">Doctor Portal</h1>
            <span class="badge bg-primary">Medical Staff</span>
        </div>

        <div class="glass-panel">
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
    </div>
    `,
    setup() {
        const appointments = ref([]);
        const editingAppt = ref(null);
        const token = localStorage.getItem('token');

        const fetchAppointments = async () => {
            const res = await fetch('/api/doctor/appointments', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) appointments.value = await res.json();
        };

        const editAppt = (appt) => {
            editingAppt.value = { ...appt }; // Copy
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
                editingAppt.value = null;
                fetchAppointments();
            }
        };

        onMounted(fetchAppointments);
        return { appointments, editingAppt, editAppt, saveAppt };
    }
};

const PatientDashboard = {
    template: `
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">Patient Portal</h1>
            <span class="badge bg-primary">Patient</span>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-5">
                <div class="glass-panel h-100">
                    <h3 class="mb-4">Book Appointment</h3>
                    <form @submit.prevent="book">
                        <div class="mb-3">
                            <label class="form-label">Select Doctor</label>
                            <select class="form-select" v-model="selectedDoctor" required>
                                <option value="" disabled>Choose a specialist...</option>
                                <option v-for="doc in doctors" :value="doc.id">
                                    {{ doc.name }} ({{ doc.specialization }})
                                </option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Preferred Date & Time</label>
                            <input type="datetime-local" class="form-control" v-model="dateTime" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Confirm Booking</button>
                    </form>
                </div>
            </div>
            
            <div class="col-lg-7">
                <div class="glass-panel mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="mb-0">My History</h3>
                        <button @click="exportData" class="btn btn-sm btn-secondary">
                            Export CSV
                        </button>
                    </div>
                    
                    <div class="list-group list-group-flush">
                        <div v-for="appt in appointments" :key="appt.id" class="list-group-item bg-transparent border-bottom border-secondary text-white py-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="mb-1">Dr. {{ appt.doctor_name }}</h5>
                                    <p class="mb-1 text-muted small">{{ new Date(appt.date_time).toLocaleString() }}</p>
                                </div>
                                <div class="text-end">
                                    <span class="badge mb-2 d-block" :class="{
                                        'bg-success': appt.status === 'Completed',
                                        'bg-warning': appt.status === 'Booked',
                                        'bg-danger': appt.status === 'Cancelled'
                                    }">{{ appt.status }}</span>
                                    <button v-if="appt.status === 'Booked'" @click="cancelAppt(appt.id)" class="btn btn-xs btn-outline-danger" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Cancel</button>
                                </div>
                            </div>
                        </div>
                        <div v-if="appointments.length === 0" class="text-center py-4 text-muted">
                            No appointment history found.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const doctors = ref([]);
        const appointments = ref([]);
        const selectedDoctor = ref('');
        const dateTime = ref('');
        const token = localStorage.getItem('token');

        const fetchData = async () => {
            const docRes = await fetch('/api/patient/doctors');
            if (docRes.ok) doctors.value = await docRes.json();

            const apptRes = await fetch('/api/patient/appointments', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (apptRes.ok) appointments.value = await apptRes.json();
        };

        const book = async () => {
            const res = await fetch('/api/patient/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    doctor_id: selectedDoctor.value,
                    date_time: dateTime.value
                })
            });
            if (res.ok) {
                fetchData();
                alert('Appointment Booked Successfully!');
                selectedDoctor.value = '';
                dateTime.value = '';
            }
        };

        const exportData = async () => {
            const res = await fetch('/api/patient/export', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) alert('Export started! You will be notified when done.');
        };

        const cancelAppt = async (id) => {
            if (!confirm('Cancel appointment?')) return;
            const res = await fetch('/api/patient/appointment/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) fetchData();
        };

        onMounted(fetchData);
        return { doctors, appointments, selectedDoctor, dateTime, book, exportData, cancelAppt };
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
