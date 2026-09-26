function localEgyptianMobile(value: string): string {
    let digits = value
        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
        .replace(/\D/g, '');
    if (digits.startsWith('0020')) digits = digits.slice(4);
    else if (digits.startsWith('20')) digits = digits.slice(2);
    if (digits.startsWith('1')) digits = `0${digits}`;
    return digits;
}

export function formatEgyptianMobile(value: string): string {
    const digits = localEgyptianMobile(value).slice(0, 11);
    return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)].filter(Boolean).join(' ');
}

export function isEgyptianMobile(value: string): boolean {
    return /^01[0125]\d{8}$/.test(localEgyptianMobile(value));
}

export function internationalMobile(value: string): string {
    return `+20${localEgyptianMobile(value).slice(1)}`;
}
