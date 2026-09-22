import * as React from "react";
import {
    ArrowUpCircleIcon,
    BarChartIcon,
    CameraIcon,
    ClipboardListIcon,
    DatabaseIcon,
    UserRound,
    FileCodeIcon,
    FileIcon,
    FileTextIcon,
    FolderIcon,
    HelpCircleIcon,
    LayoutDashboardIcon,
    ListIcon,
    SearchIcon,
    SettingsIcon,
    UsersIcon,
    UtensilsCrossed,
    TableIcon,
    Table,
    Database,
    LayoutGrid,
    ClipboardList,
    History,
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePage } from "@inertiajs/react";

export function AppSidebar({ ...props }) {
    const { auth, app, flash } = usePage().props;

    const userData = {
        name: auth?.user?.name || "Guest",
        email: auth?.user?.email || "guest@example.com",
        avatar: auth?.user?.avatar || "/images/logo/tiumay.png",
    };

    const navItems = {
        user: userData,

        navMain: [
            {
                title: "Dashboard",
                url: route("dashboard"),
                icon: LayoutDashboardIcon,
            },
            {
                title: "Customer",
                url: route("customer.index"),
                icon: LayoutGrid,
            },
            {
                title: "Supplier",
                url: route("supplier.index"),
                icon: LayoutGrid,
            },

            {
                title: "Category",
                url: route("category.index"),
                icon: ListIcon,
            },
            {
                title: "Ingredient",
                url: route("ingredient.index"),
                icon: FileTextIcon,
            },
            {
                title: "Product",
                url: route("product.index"),
                icon: UtensilsCrossed,
            },
            {
                title: "POS",
                url: route("menu.menu"),
                icon: ClipboardList,
            },
            {
                title: "Order History",
                url: route("history.index"),
                icon: History,
            },
            {
                title: "Purchasing",
                url: route("purchasing.index"),
                icon: Database,
            },
            {
                title: "Printers",
                url: route("printer.index"),
                icon: SettingsIcon,
            },
        ],
        navClouds: [
            {
                title: "Capture",
                icon: CameraIcon,
                isActive: true,
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
            {
                title: "Proposal",
                icon: FileTextIcon,
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
            {
                title: "Prompts",
                icon: FileCodeIcon,
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
        ],
        navSecondary: [
            {
                title: "Settings",
                url: "#",
                icon: SettingsIcon,
            },
            {
                title: "Get Help",
                url: "#",
                icon: HelpCircleIcon,
            },
            {
                title: "Search",
                url: "#",
                icon: SearchIcon,
            },
        ],
        documents: [
            {
                name: "Users",
                url: route("user.index"),
                icon: UserRound,
            },
        ],
    };

    // Log the user data to verify it's working

    if (flash?.success) {
        console.log("Flash success:", flash.success);
    }
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex justify-center">
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-2 object-center h-15 w-28 p-0"
                        >
                            <a href="#">
                                <img
                                    src="/images/logo/tiumay.png"
                                    alt="Tiumai"
                                    className="object-contain"
                                />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems.navMain} />
                <NavDocuments items={navItems.documents} />
                {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={navItems.user} />
            </SidebarFooter>
        </Sidebar>
    );
}
// console.log("data", navItems.user);
