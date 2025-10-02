"use client";

import React, {} from "react";
import type { ToastProps } from "./toast";

const TOAST_LIMIT = 3;

type ToasterToast = ToastProps & {
	id: string;
	title?: string;
	description?: string;
	action?: React.ReactNode;
};

const actionTypes = {
	ADD_TOAST: "ADD_TOAST",
	UPDATE_TOAST: "UPDATE_TOAST",
	DISMISS_TOAST: "DISMISS_TOAST",
	REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
	count = (count + 1) % Number.MAX_SAFE_INTEGER;
	return count.toString();
}

type State = {
	toasts: ToasterToast[];
};

type Action =
	| { type: typeof actionTypes.ADD_TOAST; toast: ToasterToast }
	| {
			type: typeof actionTypes.UPDATE_TOAST;
			toast: Partial<ToasterToast> & { id: string };
	  }
	| { type: typeof actionTypes.DISMISS_TOAST; toastId?: ToasterToast["id"] }
	| { type: typeof actionTypes.REMOVE_TOAST; toastId?: ToasterToast["id"] };

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case actionTypes.ADD_TOAST:
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			};

		case actionTypes.UPDATE_TOAST: {
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
				),
			};
		}

		case actionTypes.DISMISS_TOAST: {
			const { toastId } = action;

			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === toastId ? { ...toast, open: false } : toast,
				),
			};
		}
		case actionTypes.REMOVE_TOAST:
			return {
				...state,
				toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
			};
	}
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
	memoryState = reducer(memoryState, action);
	listeners.forEach((listener) => {
		listener(memoryState);
	});
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
	const id = genId();

	const update = (props?: ToastProps) =>
		dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...props, id } });

	const dismiss = () =>
		dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

	dispatch({
		type: actionTypes.ADD_TOAST,
		toast: {
			...props,
			id,
			open: true,
			onOpenChange: (open) => {
				if (!open) {
					dismiss();
				}
			},
		},
	});

	return {
		id: id,
		dismiss,
		update,
	};
}

function useToast() {
	const [state, setState] = React.useState<State>(memoryState);

	React.useEffect(() => {
		listeners.push(setState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		};
	}, [state]);

	return {
		...state,
		toast,
		dismiss: (toastId?: string) =>
			dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
	};
}

export { useToast, toast };
