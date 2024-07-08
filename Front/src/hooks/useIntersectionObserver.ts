import { useEffect, useRef } from "react";

type Callback = (entries: IntersectionObserverEntry[]) => void;

const useIntersectionObserver = (
	callback: Callback,
	options?: IntersectionObserverInit
) => {
	const observer = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (observer.current) observer.current.disconnect();

		observer.current = new IntersectionObserver(callback, options);

		return () => observer.current?.disconnect();
	}, [callback, options]);

	const observe = (element: HTMLElement | null) => {
		if (element) observer.current?.observe(element);
	};

	return observe;
};

export default useIntersectionObserver;
