import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function useEditUser(user) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        name: "",
        email: "",
        role_id: "",
        password: "",
        password_confirmation: "",
    });

    // Sync form when modal opens
    useEffect(() => {
        if (!user || !open) return;

        setData({
            name: user.name || "",
            email: user.email || "",
            role_id: user.role_id || "",
            password: "",
            password_confirmation: "",
        });
    }, [user, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleRoleChange = (value) => {
        setData("role_id", value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const toastId = toast.loading("Updating user...", {
            position: "top-center",
            duration: Infinity,
        });

        post(route("user.update", user.id), {
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("User updated successfully!", {
                    duration: 3000,
                    position: "top-center",
                });
                closeModal();
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                const errorMessage =
                    Object.values(errors)[0] || "Failed to update user";
                toast.error(errorMessage, {
                    duration: 4000,
                    position: "top-center",
                    style: {
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                    },
                });
            },
            preserveScroll: true,
        });
    };

    return {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
        handleRoleChange,
    };
}
