import React, { FunctionComponent, ReactElement } from 'react';
import PageError from '../Error/PageError';
import PageLoader from '../Loader/PageLoader';
import TopSection from '../TopSection/TopSection';

export interface ComponentProps {
    header?: undefined | ReactElement;
    footer?: undefined | ReactElement;
    navBar?: undefined | ReactElement;
    children: ReactElement | Array<ReactElement>;
    isLoading: boolean;
    error: string;
    mainContentStyle?: React.CSSProperties | undefined;
}

const MasterPage: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    if (props.isLoading) {
        return (
            <React.Fragment>
                <PageLoader isVisible={true} />
            </React.Fragment>
        );
    }

    if (props.error) {
        return (
            <React.Fragment>
                <PageError message={props.error} />
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <>
                <TopSection
                    header={props.header}
                    navbar={props.navBar}
                    isRenderedOnMobile={false}
                />

                {props.children}

                {props.footer && props.footer}
            </>
        </React.Fragment>
    );
};

export default MasterPage;
