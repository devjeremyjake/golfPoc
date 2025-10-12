// Simple debounce function
export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	delay: number
): ((...args: Parameters<T>) => void) => {
	let timeoutId: any;

	return function (this: any, ...args: Parameters<T>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
};
