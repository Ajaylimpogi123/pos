import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { router } from "@inertiajs/react";

export default function useAddProduct() {
    const [open, setOpen] = useState(false);

    const { data, setData, errors, processing, setError, reset } = useForm({
        cat_id: "",
        pd_name: "",
        pd_description: "",
        pd_price: 0,
        pd_qty: 0,
        pd_cost: 0,
        pd_mqty: 0,
        pd_image: null,
        ingredients: [],
    });

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        setData("pd_image", e.target.files[0]);
    };

    const handleCategoryChange = (value) => {
        setData("cat_id", value);
    };

    const addIngredient = (ingredient) => {
        const alreadyAdded = data.ingredients.find(
            (i) => i.ing_id === ingredient.ing_id,
        );
        if (alreadyAdded) return;

        setData("ingredients", [
            ...data.ingredients,
            {
                ing_id: ingredient.ing_id,
                ing_name: ingredient.ing_name,
                unit: ingredient.unit,
                pd_ing_qty: 1,
            },
        ]);
    };

    const removeIngredient = (ing_id) => {
        setData(
            "ingredients",
            data.ingredients.filter((i) => i.ing_id !== ing_id),
        );
    };

    const updateIngredientQty = (ing_id, qty) => {
        setData(
            "ingredients",
            data.ingredients.map((i) =>
                i.ing_id === ing_id
                    ? { ...i, pd_ing_qty: parseFloat(qty) || 0 }
                    : i,
            ),
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Build FormData manually — required for file + nested array together
        const formData = new FormData();
        formData.append("cat_id", data.cat_id);
        formData.append("pd_name", data.pd_name);
        formData.append("pd_description", data.pd_description ?? "");
        formData.append("pd_price", data.pd_price);
        formData.append("pd_cost", data.pd_cost);
        formData.append("pd_qty", data.pd_qty);
        formData.append("pd_mqty", data.pd_mqty);

        if (data.pd_image) {
            formData.append("pd_image", data.pd_image);
        }

        // Serialize ingredients as indexed keys Laravel expects:
        // ingredients[0][ing_id], ingredients[0][pd_ing_qty], ...
        data.ingredients.forEach((ing, index) => {
            formData.append(`ingredients[${index}][ing_id]`, ing.ing_id);
            formData.append(
                `ingredients[${index}][pd_ing_qty]`,
                ing.pd_ing_qty,
            );
        });

        router.post(route("product.store"), formData, {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (errs) => {
                // Push server errors back into useForm's error state
                Object.keys(errs).forEach((key) => setError(key, errs[key]));
            },
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
        handleFileChange,
        handleCategoryChange,
        addIngredient,
        removeIngredient,
        updateIngredientQty,
    };
}
