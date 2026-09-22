<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {

        $search = $request->input('search');

        $users = User::when($search, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('User/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
            'roles' => Role::all(),

        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['required', 'exists:tr_role,id'],
        ]);

        User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role_id' => $validatedData['role_id'],
            'branch_id' => auth()->user()->branch_id,
        ]);

        return redirect('/user')->with('success', 'User created successfully!');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role_id' => ['required', 'exists:tr_role,id'],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->name = $validatedData['name'];
        $user->email = $validatedData['email'];
        $user->role_id = $validatedData['role_id'];

        if (! empty($validatedData['password'])) {
            $user->password = Hash::make($validatedData['password']);
        }

        $user->save();

        return redirect('/user')->with('success', 'User updated successfully!');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        if (in_array($user->role_id, [2, 3], true)) {
            $remainingAdmins = User::whereIn('role_id', [2, 3])
                ->where('id', '!=', $user->id)
                ->count();

            if ($remainingAdmins === 0) {
                return redirect()->back()->withErrors([
                    'user' => 'Cannot delete the last remaining admin/superadmin user.',
                ]);
            }
        }

        $user->delete();

        return redirect('/user')->with('success', 'User deleted successfully!');
    }
}
