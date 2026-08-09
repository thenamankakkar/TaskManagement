import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Task, User, Role } from './api.service';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule, ReactiveFormsModule], templateUrl: './app.component.html', styleUrl: './team.component.css' })
export class AppComponent implements OnInit, OnDestroy {
  user?: User; tasks: Task[] = []; allTasks: Task[] = []; users: User[] = []; error = ''; message = ''; authMode: 'login' | 'register' = 'login'; filter = ''; employeeSearch = ''; teamLeadFilter = ''; editing?: Task;
  authForm = this.fb.group({ username: ['', [Validators.minLength(2), Validators.maxLength(50)]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], role: ['employee' as Role, Validators.required] });
  taskForm = this.fb.group({ title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]], description: ['', Validators.maxLength(1000)], status: ['pending' as 'pending' | 'completed'], assignedTo: [''] });
  constructor(private fb: FormBuilder, private api: ApiService) {}
  ngOnInit() { const saved = localStorage.getItem('task_user'); if (saved) { this.user = JSON.parse(saved); this.openDashboard(); } }
  ngOnDestroy() { this.api.disconnect(); }
  get f() { return this.authForm.controls; } get t() { return this.taskForm.controls; }
  submitAuth() {
    this.error = ''; if (this.authMode === 'register') { this.authForm.controls.username.addValidators(Validators.required); } else { this.authForm.controls.username.clearValidators(); }
    this.authForm.controls.username.updateValueAndValidity(); if (this.authForm.invalid) { this.authForm.markAllAsTouched(); return; }
    const request = this.authMode === 'login' ? this.api.login({ email: this.f.email.value!, password: this.f.password.value! }) : this.api.register(this.authForm.getRawValue());
    request.subscribe({ next: result => { localStorage.setItem('task_token', result.token); localStorage.setItem('task_user', JSON.stringify(result.user)); this.user = result.user; this.openDashboard(); }, error: e => this.error = e.error?.message || 'We could not complete that request. Please try again.' });
  }
  openDashboard() { this.load(); this.loadUsers(); this.api.connect(() => this.load(), () => this.loadUsers()); }
  loadUsers() { this.api.users().subscribe({ next: users => { this.users = users; this.applyTeamLeadFilter(); }, error: () => this.users = [] }); }
  load() { this.api.tasks(this.filter).subscribe({ next: tasks => { this.allTasks = tasks; this.applyTeamLeadFilter(); }, error: e => this.error = e.error?.message || 'Tasks could not be loaded.' }); }
  saveTask() { this.error = ''; if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; } const data = this.taskForm.getRawValue(); const action = this.editing ? this.api.updateTask(this.editing._id, data) : this.api.createTask(data); action.subscribe({ next: () => { this.message = this.editing ? 'Task updated.' : 'Task created.'; this.cancelEdit(); this.load(); }, error: e => this.error = e.error?.message || 'Task could not be saved.' }); }
  edit(task: Task) { this.editing = task; this.taskForm.patchValue({ title: task.title, description: task.description, status: task.status, assignedTo: task.assignedTo._id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  cancelEdit() { this.editing = undefined; this.taskForm.reset({ status: 'pending', assignedTo: '' }); }
  assignTeamLead(employee: User, teamLead: string) { this.error = ''; this.message = ''; this.api.updateUser(employee._id, { teamLead: teamLead || null }).subscribe({ next: () => { this.message = teamLead ? `${employee.username} was assigned successfully.` : `${employee.username} is now unassigned.`; this.loadUsers(); }, error: e => this.error = e.error?.message || 'Team assignment could not be updated.' }); }
  complete(task: Task) { this.api.updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' }).subscribe({ next: () => this.load(), error: e => this.error = e.error?.message || 'Task could not be updated.' }); }
  remove(task: Task) { if (!confirm(`Delete “${task.title}”? This cannot be undone.`)) return; this.api.deleteTask(task._id).subscribe({ next: () => { this.message = 'Task deleted.'; this.load(); }, error: e => this.error = e.error?.message || 'Task could not be deleted.' }); }
  logout() { localStorage.removeItem('task_token'); localStorage.removeItem('task_user'); this.api.disconnect(); this.user = undefined; this.tasks = []; this.authForm.reset({ role: 'employee' }); }
  setFilter(value: string) { this.filter = value; this.load(); }
  setTeamLeadFilter(value: string) { this.teamLeadFilter = value; this.applyTeamLeadFilter(); }
  applyTeamLeadFilter() { if (!this.teamLeadFilter) { this.tasks = [...this.allTasks]; return; } const memberIds = new Set([this.teamLeadFilter, ...this.employees.filter(employee => this.teamLeadId(employee) === this.teamLeadFilter).map(employee => employee._id)]); this.tasks = this.allTasks.filter(task => memberIds.has(task.assignedTo._id)); }
  canAssign() { return this.user?.role !== 'employee'; }
  get teamLeads() { return this.users.filter(person => person.role === 'team_lead'); }
  get employees() { return this.users.filter(person => person.role === 'employee'); }
  get displayedEmployees() { const query = this.employeeSearch.trim().toLowerCase(); return query ? this.employees.filter(person => person.username.toLowerCase().includes(query) || person.email.toLowerCase().includes(query)) : this.employees; }
  get displayedTasks() { if (!this.teamLeadFilter) return this.tasks; const memberIds = new Set([this.teamLeadFilter, ...this.employees.filter(employee => this.teamLeadId(employee) === this.teamLeadFilter).map(employee => employee._id)]); return this.tasks.filter(task => memberIds.has(task.assignedTo._id)); }
  teamLeadId(employee: User) { return typeof employee.teamLead === 'string' ? employee.teamLead : employee.teamLead?._id || ''; }
  teamLeadName(employee: User) { if (typeof employee.teamLead === 'object' && employee.teamLead) return employee.teamLead.username; return this.teamLeads.find(lead => lead._id === this.teamLeadId(employee))?.username || 'Unassigned'; }
}
