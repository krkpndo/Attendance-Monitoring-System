import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../auth.queries';
import { loginRequestSchema, type LoginRequest } from '../auth.schema';
import { useForm } from 'react-hook-form';

export function LoginPage() {
    const login = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginRequest>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { identifier: '', password: '' }
    });

    const onSubmit = (data: LoginRequest) => {
        login.mutate(data);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className='card w-full max-w-sm bg-base-100 shadow-xl'>
                <form className='card-body' onSubmit={handleSubmit(onSubmit)} noValidate>
                    <h1 className='card-title justify-center text-2xl'>Sign In</h1>

                    {/* Server-side failure (wrong credentials, etc.) - the normalized ApiError. */}
                    {login.isError && (
                        <div role='alert' className='alert alert-error text-sm'>
                            <span>{login.error?.message}</span>
                        </div>
                    )}

                    {/* Identifier */}
                    <div className='form-control'>
                        <label className='label' htmlFor='identifier'>
                            <span className='label-text'>Student No. / Employee No.</span>
                        </label>
                        <input
                            id='identifier'
                            type='text'
                            autoComplete='username'
                            className={`input input-bordered ${errors.identifier ? 'input-error' : ''}`}
                            {...register('identifier')}
                        />
                        {errors.identifier && (
                            <span className='label-text-alt text-error mt -1'>
                                {errors.identifier.message}
                            </span>
                        )}
                    </div>

                    {/* Password */}
                    <div className='form-control'>
                        <label htmlFor="password" className='label'>
                            <span className='label-text'>Password</span>
                        </label>
                        <input
                            id='password'
                            type='password'
                            autoComplete='current-password'
                            className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <span className='label-text-alt text-error mt-1'>
                                {errors.password?.message}
                            </span>
                        )}
                    </div>

                    <button
                        type='submit'
                        className='btn btn-primary mt-4'
                        disabled={login.isPending}
                    >
                        {login.isPending && <span className='loading loading-spinner'/>}
                        {login.isPending ? 'Signing in...' : 'Sign in'}
                    </button>
                    <p className='text-success text-sm text-center'>
                        Logged in as {login.data?.user.type}
                    </p>
                </form>
            </div>
        </div>
    );
}

// The concepts in play

// Two layers of validation, each in its place:

// - zodResolver(loginRequestSchema) runs your request schema against the form before onSubmit ever fires. If identifier is empty, RHF blocks submit and populates errors.identifier.message ("Identifier is required" — the message you wrote in the schema). That's the same loginRequestSchema from Step 1, reused — your schema is the single source of truth for both the request type and the form rules.
// - login.error is the server's "no, that's wrong" (bad credentials), already normalized to ApiError by your client interceptor. Client validation = "did you fill it in"; server error = "are these credentials real." Two different questions, two different displays.

// register('identifier') is RHF's uncontrolled-input wiring — it returns the onChange/onBlur/ref/name and spreads them onto the <input>. Mentally: instead of useState + onChange on every field (controlled, re-renders on each keystroke), RHF reads values via refs and only re-renders when it needs to (on error/submit). It's the lean, performance-first form approach — fits your "best, not just works" bar.

// handleSubmit(onSubmit) is the gate: it runs validation, and only calls your onSubmit(data) with a fully-typed, validated LoginRequest if it passes. Your handler never sees invalid data.

// The three render states come straight off the mutation object — login.isPending (disable + spinner), login.isError + login.error.message (alert), and the idle default. No local useState for any of it; TanStack Query owns that state.