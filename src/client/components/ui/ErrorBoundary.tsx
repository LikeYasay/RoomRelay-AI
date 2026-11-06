import React from 'react'
import type { ReactNode } from 'react'
import { StateScreen } from './StateScreen'

interface Props {
    children: ReactNode
}

interface State {
    failed: boolean
}

/**
 * Catches unexpected render errors so the whole page does not go blank.
 * The details are deliberately NOT shown to the user (they could leak internals).
 */
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { failed: false }

    static getDerivedStateFromError(): State {
        return { failed: true }
    }

    componentDidCatch(error: Error): void {
        // Name only, no stack or message in the console output of a shared screen.
        console.error('RoomRelay AI UI error:', error.name)
    }

    render(): ReactNode {
        if (this.state.failed) {
            return (
                <StateScreen
                    icon="alert"
                    tone="danger"
                    title="Something went wrong"
                    message="This screen could not be displayed. Reload the page to try again."
                >
                    <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
                        Reload page
                    </button>
                </StateScreen>
            )
        }
        return this.props.children
    }
}
