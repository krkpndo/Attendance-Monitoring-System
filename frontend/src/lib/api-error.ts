export interface FieldError {
    field: string;
    message: string;
}

export class ApiError extends Error {
    readonly status: number
    readonly code?: string
    readonly fieldErrors?: FieldError[]

    constructor(
        message: string,
        status: number,
        code?: string,
        fieldErrors?: FieldError[]
    ) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.fieldErrors = fieldErrors
    };
}

// readonly — can be assigned once in the constructor, never reassigned afterward. An error's details shouldn't mutate after it's created, so this enforces that at compile time.