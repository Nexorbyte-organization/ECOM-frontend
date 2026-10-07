interface ProfileOptionPickerProps {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
    isArabic: boolean;
    error?: string;
    allOption?: { label: string; checked: boolean; onToggle: () => void };
}

export default function ProfileOptionPicker({ title, options, selected, onToggle, isArabic, error, allOption }: ProfileOptionPickerProps) {
    const count = allOption?.checked ? options.length : selected.length;

    return (
        <fieldset className="min-w-0">
            <legend className="mb-3 flex w-full items-center justify-between gap-3">
                <span className="text-sm font-semibold text-dark-100">{title}</span>
                <span className="text-xs text-dark-400">
                    {count} {isArabic ? 'محدد' : 'selected'}
                </span>
            </legend>
            <div className="flex flex-wrap gap-2">
                {allOption && (
                    <button
                        type="button"
                        aria-pressed={allOption.checked}
                        onClick={allOption.onToggle}
                        className={`min-h-8 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${allOption.checked ? 'border-primary-500 bg-primary-500 text-on-primary' : 'border-dark-700 bg-dark-900 text-dark-200 hover:bg-dark-800'}`}
                    >
                        {allOption.label}
                    </button>
                )}
                {options.map((option) => {
                    const checked = !!allOption?.checked || selected.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={checked}
                            disabled={allOption?.checked}
                            onClick={() => onToggle(option)}
                            className={`min-h-8 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-default ${checked ? 'border-primary-500 bg-primary-500 text-on-primary' : 'cursor-pointer border-dark-700 bg-dark-900 text-dark-200 hover:bg-dark-800'}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
            {error && <p role="alert" data-profile-error className="mt-2 text-xs text-danger-500">{error}</p>}
        </fieldset>
    );
}
