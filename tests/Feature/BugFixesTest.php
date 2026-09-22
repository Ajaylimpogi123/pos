<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Targeted regression tests for the 11 approved bug fixes reviewed in this
 * QA pass. Uses DatabaseTransactions (NOT RefreshDatabase/DatabaseMigrations)
 * because phpunit.xml points at the real db_pos MySQL database — every test
 * here must roll back cleanly and must never mutate real seeded rows
 * (admin@gmail.com / cashier@gmail.com / the one real Branch/Supplier/Category)
 * outside of that rollback.
 */
class BugFixesTest extends TestCase
{
    use DatabaseTransactions;

    // ---------------------------------------------------------------
    // Item 2/3: self-registration
    // ---------------------------------------------------------------

    public function test_registration_creates_user_with_default_role_and_branch(): void
    {
        $branch = Branch::firstOrFail();

        $response = $this->post('/register', [
            'name' => 'Test Newcomer',
            'email' => 'newcomer-'.uniqid().'@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('name', 'Test Newcomer')->first();

        $this->assertNotNull($user, 'Registration did not create a user.');
        $this->assertSame(1, $user->role_id, 'Newly registered user should default to role_id 1 (Staff).');
        $this->assertNotNull($user->branch_id, 'Newly registered user should have a non-null branch_id.');
        $this->assertSame($branch->id, $user->branch_id);
    }

    public function test_guest_register_route_is_reachable_without_authentication(): void
    {
        // No actingAs() — this must NOT redirect to /login. Before the
        // route-order fix, routes/user.php's auth-gated 'register' route
        // shadowed this one and self-registration was unreachable, which
        // would surface here as a 302 to /login.
        $response = $this->get('/register');

        $response->assertOk();
    }

    // ---------------------------------------------------------------
    // Item 4: UserController CRUD
    // ---------------------------------------------------------------

    public function test_user_store_persists_branch_id_from_acting_admin_not_from_input(): void
    {
        $adminBranch = Branch::create(['branch_name' => 'QA Admin Branch '.uniqid()]);

        $admin = User::factory()->create([
            'branch_id' => $adminBranch->id,
            'role_id' => 2,
        ]);

        // Deliberately try to inject a different branch_id (e.g. 999) —
        // store() must ignore it and use the acting admin's own branch_id.
        $response = $this->actingAs($admin)->post(route('user.store'), [
            'name' => 'New Staff Member',
            'email' => 'staff-'.uniqid().'@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => 1,
            'branch_id' => 999999,
        ]);

        $response->assertRedirect('/user');
        $response->assertSessionHasNoErrors();

        $created = User::where('name', 'New Staff Member')->first();

        $this->assertNotNull($created);
        $this->assertSame($adminBranch->id, $created->branch_id);
        $this->assertNotEquals(999999, $created->branch_id);
    }

    public function test_user_destroy_refuses_to_delete_self(): void
    {
        $branch = Branch::firstOrFail();
        $actor = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);

        $response = $this->actingAs($actor)->delete(route('user.destroy', $actor->id));

        $response->assertSessionHasErrors('user');
        $this->assertNotNull($actor->fresh(), 'User should not have been able to delete themself.');
    }

    public function test_user_destroy_refuses_to_delete_the_last_admin(): void
    {
        $branch = Branch::firstOrFail();

        // Real seeded data currently has exactly one Admin/Superadmin
        // (admin@gmail.com, role_id=2) and no others. Target that real
        // admin from a different, unrelated actor account. The guard must
        // reject this BEFORE any delete() call runs, so the real admin
        // row is never touched even transiently.
        $lastAdmin = User::whereIn('role_id', [2, 3])->firstOrFail();
        $otherAdminOrSuperadminCount = User::whereIn('role_id', [2, 3])
            ->where('id', '!=', $lastAdmin->id)
            ->count();

        $this->assertSame(
            0,
            $otherAdminOrSuperadminCount,
            'Test assumption violated: expected exactly one Admin/Superadmin in the DB right now. '
            .'If this fails, seed data has changed and this test needs updating.'
        );

        $actor = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);

        $response = $this->actingAs($actor)->delete(route('user.destroy', $lastAdmin->id));

        $response->assertSessionHasErrors('user');
        $this->assertNotNull($lastAdmin->fresh(), 'The last Admin/Superadmin must not be deletable.');
        $this->assertSame(2, $lastAdmin->fresh()->role_id);
    }

    public function test_user_destroy_succeeds_when_another_admin_exists(): void
    {
        $branch = Branch::firstOrFail();

        $actor = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);
        $extraAdmin = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 2]);
        $targetAdmin = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 2]);

        $response = $this->actingAs($actor)->delete(route('user.destroy', $targetAdmin->id));

        $response->assertSessionHasNoErrors();
        $this->assertNull($targetAdmin->fresh(), 'Deleting an admin should succeed when another admin/superadmin remains.');
        $this->assertNotNull($extraAdmin->fresh());
    }

    // ---------------------------------------------------------------
    // Item 1: Supplier destroy
    // ---------------------------------------------------------------

    public function test_supplier_destroy_removes_supplier_and_does_not_touch_categories(): void
    {
        $branch = Branch::firstOrFail();
        $actor = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);

        $supplier = Supplier::create([
            'supplier_name' => 'QA Test Supplier '.uniqid(),
            'contact_person' => 'Jane Tester',
            'contact_number' => '09171234567',
            'email' => 'supplier-'.uniqid().'@example.com',
            'address' => '123 Test St',
        ]);

        $categoryCountBefore = \App\Models\Category::count();

        $response = $this->actingAs($actor)->delete(route('supplier.destroy', $supplier->id));

        $response->assertRedirect('/supplier');
        $this->assertNull(Supplier::find($supplier->id), 'Supplier should have been deleted.');
        $this->assertSame($categoryCountBefore, \App\Models\Category::count(), 'Deleting a supplier must not affect tbl_category.');
    }

    // ---------------------------------------------------------------
    // Item 5: invoice_no uniqueness
    // ---------------------------------------------------------------

    public function test_two_orders_placed_same_day_get_distinct_invoice_numbers(): void
    {
        $branch = Branch::firstOrFail();
        $actor = User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);

        // pd_id=1 ("Egg with Rice") has no linked ingredients and ample
        // pd_qty in the real seeded data, so this checkout exercises the
        // real store() path without needing to fabricate ingredient stock.
        $product = Product::findOrFail(1);
        $this->assertGreaterThanOrEqual(2, $product->pd_qty, 'Seeded product does not have enough stock for this test.');

        $payload = [
            'payment_method' => 'cash',
            'od_amount_due' => 50,
            'od_discount' => 0,
            'od_total_amt_due' => 50,
            'od_payment' => 50,
            'od_change' => 0,
            'items' => [
                ['pd_id' => $product->pd_id, 'ct_qty' => 1, 'ct_price' => 50],
            ],
        ];

        $before = Order::whereDate('created_at', today())->max('od_id') ?? 0;

        $response1 = $this->actingAs($actor)->post(route('order.place'), $payload);
        $response1->assertSessionHasNoErrors();
        $response1->assertRedirect(route('menu.menu'));

        $response2 = $this->actingAs($actor)->post(route('order.place'), $payload);
        $response2->assertSessionHasNoErrors();
        $response2->assertRedirect(route('menu.menu'));

        $todaysOrders = Order::whereDate('created_at', today())
            ->where('od_id', '>', $before)
            ->orderBy('od_id')
            ->get();

        $this->assertCount(2, $todaysOrders, 'Expected exactly the two orders placed in this test.');
        $this->assertNotSame(
            $todaysOrders[0]->invoice_no,
            $todaysOrders[1]->invoice_no,
            'Two orders placed back-to-back on the same day must get distinct invoice numbers.'
        );
        $this->assertNotEmpty($todaysOrders[0]->invoice_no);
        $this->assertNotEmpty($todaysOrders[1]->invoice_no);
    }
}
