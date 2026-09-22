import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function useAddUser() {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role_id: "",
    });

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

        const toastId = toast.loading("Creating user...", {
            position: "top-center",
            duration: Infinity,
        });

        post(route("user.store"), {
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("User created successfully!", {
                    duration: 3000,
                    position: "top-center",
                });
                closeModal();
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                const errorMessage =
                    Object.values(errors)[0] || "Failed to create user";
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
        // modal
        open,
        openModal,
        closeModal,

        // form
        data,
        setData,
        errors,
        processing,

        // handlers
        handleSubmit,
        handleRoleChange,
    };
}
