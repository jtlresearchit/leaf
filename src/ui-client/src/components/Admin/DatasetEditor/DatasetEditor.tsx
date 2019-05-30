/* Copyright (c) 2019, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import React from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import AdminState, { AdminPanelLoadState } from '../../../models/state/AdminState';
import { DatasetsState, InformationModalState } from '../../../models/state/GeneralUiState';
import DatasetContainer from '../../PatientList/AddDatasetSelectors/DatasetContainer';
import { SqlBox } from '../../Other/SqlBox/SqlBox';
import { Section } from '../ConceptEditor/Sections/Section';
import { DefTemplates } from '../../../models/patientList/DatasetDefinitionTemplate';
import { PatientListDatasetShape, PatientListDatasetQueryDTO, CategorizedDatasetRef } from '../../../models/patientList/Dataset';
import { AdminPanelPatientListColumnTemplate } from '../../../models/patientList/Column';
import { fetchAdminDatasetIfNeeded, setAdminDataset, setAdminDatasetShape, setAdminDatasetSql, revertAdminDatasetChanges, saveAdminDataset, setAdminDemographicsDataset, setAdminEditingDemographics, saveAdminDemographicsDataset } from '../../../actions/admin/dataset';
import { AdminDatasetQuery } from '../../../models/admin/Dataset';
import { FiCheck } from 'react-icons/fi';
import { ShapeDropdown } from './ShapeDropdown/ShapeDropdown';
import formatSql from '../../../utils/formatSql';
import { TextArea } from '../ConceptEditor/Sections/TextArea';
import { setPatientListDatasetByIndex, showInfoModal } from '../../../actions/generalUi';
import { Constraints } from './Constraints/Constraints';
import LoaderIcon from '../../Other/LoaderIcon/LoaderIcon';
import { DatasetQueryCategoryDropdown } from './CategoryDropdown/CategoryDropdown';
import './DatasetEditor.css';

interface Props { 
    data: AdminState;
    datasets: DatasetsState;
    dispatch: any;
}

interface State {
    categoryIdx: number;
    datasetIdx: number;
    expandedDatasets: DatasetsState;
    shapes: PatientListDatasetShape[];
}

const demographics: CategorizedDatasetRef = {
    category: '',
    datasets: [{ id: 'demographics', shape: PatientListDatasetShape.Demographics, category: '', name: 'Basic Demographics' }]
};

let dsCount = 0;

export class DatasetEditor extends React.PureComponent<Props,State> {
    private className = 'dataset-editor';
    constructor(props: Props) {
        super(props);
        this.state = {
            categoryIdx: 0,
            datasetIdx: -1,
            expandedDatasets: { ...props.datasets },
            shapes: []
        }
    }

    public getSnapshotBeforeUpdate() {
        const { datasets } = this.props;
        const newDsCount = datasets.available.reduce((a: number, b: CategorizedDatasetRef) => a + b.datasets.length, 0);

        if (dsCount !== newDsCount) {
            dsCount = newDsCount;
            const expandedDatasets = this.updateExpandedDatasets();
            this.setState({ expandedDatasets });
        }
        return null;
    }

    public componentDidUpdate() { }

    public componentDidMount() {
        let shapes: PatientListDatasetShape[] = [];

        DefTemplates.forEach((t) => {
            if (t.shape !== PatientListDatasetShape.Demographics) {
                shapes.push(t.shape);
            }
            shapes = shapes.sort((a,b) => PatientListDatasetShape[a] > PatientListDatasetShape[b] ? 1 : -1);
        });
        this.setState({ shapes });
    }

    public render() {
        const { data, datasets, dispatch } = this.props;
        const { categoryIdx, datasetIdx, } = this.state;
        const { currentDataset, changed, editingDemographics, demographicsDataset } = data.datasets;
        const { expandedDatasets } = this.state;
        const c = this.className;

        return (
            <div className={c}>
                <Container fluid={true}>
                    <Row className={`${c}-container-row`}>
                        <Col md={4} lg={4} xl={5} className={`${c}-column-left`}>
                            <DatasetContainer 
                                autoSelectOnSearch={false}
                                categoryIdx={categoryIdx}
                                datasetIdx={datasetIdx}
                                datasets={expandedDatasets}
                                dispatch={dispatch}
                                handleDatasetSelect={this.handleDatasetSelect}
                                handleDatasetRequest={this.handleDatasetRequest}
                            />
                        </Col>
                        <div className={`${c}-column-right`}>
                            {this.getStatusDependentContent(data.datasets.state, 'concept-editor')}
                            <div className={`${c}-main`}>

                                {/* New, Undo, Save, Delete buttons */}
                                {datasets.unfilteredAvailableCount > 0 &&
                                <div className={`${c}-column-right-header`}>
                                    <Button className='leaf-button leaf-button-addnew' disabled={changed}>+ Create New Dataset</Button>
                                    <Button className='leaf-button leaf-button-secondary' disabled={!changed} onClick={this.handleUndoChanges}>Undo Changes</Button>
                                    <Button className='leaf-button leaf-button-primary' disabled={!changed} onClick={this.handleSaveChanges}>Save</Button>
                                    <Button className='leaf-button leaf-button-warning'>Delete</Button>
                                </div>
                                }        

                                {/* Editor */}
                                {currentDataset &&
                                <Section header='Dataset'>

                                    {/* Non-demographics datasets */}
                                    {!editingDemographics && this.getDatasetEditorContent(currentDataset as AdminDatasetQuery)}

                                    {/* Demographics dataset */}
                                    {editingDemographics && this.getDemographicsEditorContent(currentDataset)}

                                </Section>
                                }

                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
        );
    }

    private getDemographicsEditorContent = (dataset: AdminDemographicsDatasetQuery) => {
        const { data } = this.props;
        const sqlWidth = this.getSqlWidth();
        const c = this.className;

        return (
            <div className={`${c}-sql-container`}>
                <div className={`${c}-column-container`}>
                    {data.datasets.expectedColumns.map((col) => this.getColumnContent(col))}
                </div>
                <div className={`${c}-sql`}>
                    <SqlBox sql={dataset.sql} height={350} width={sqlWidth} readonly={false} changeHandler={this.handleSqlChange}/>
                    <div className={`${c}-sql-autoformat`} onClick={this.handleAutoFormatClick}>Auto-format</div>
                </div>
            </div>
        );
    }

    private getDatasetEditorContent = (dataset: AdminDatasetQuery) => {
        const { dispatch, data } = this.props;
        const { shapes } = this.state;
        const sqlWidth = this.getSqlWidth();
        const c = this.className;
        let currentCategory = undefined;

        if (dataset && dataset.categoryId) {
            currentCategory = data.datasetQueryCategories.categories.get(dataset.categoryId)!;
        }

        return (
           <div>
                <Row>
                    <Col md={4}>
                    <TextArea 
                        changeHandler={this.handleInputChange} propName={'name'} value={dataset.name}
                        label='Name' required={true} subLabel='Text for this Dataset'
                    />
                    </Col>
                    <Col md={4}>
                        <DatasetQueryCategoryDropdown
                            changeHandler={this.handleInputChange} 
                            dispatch={dispatch} 
                            currentCategory={currentCategory} 
                            categories={data.datasetQueryCategories.categories}
                        />
                    </Col>
                    <Col md={4}>
                        <ShapeDropdown dispatch={dispatch} shapes={shapes} selected={dataset.shape} clickHandler={this.handleShapeClick}/>
                    </Col>
                </Row>
                <div className={`${c}-sql-container`}>
                    <div className={`${c}-column-container`}>
                        {data.datasets.expectedColumns.map((col) => this.getColumnContent(col))}
                    </div>
                    <div className={`${c}-sql`}>
                        <SqlBox sql={dataset.sql} height={350} width={sqlWidth} readonly={false} changeHandler={this.handleSqlChange}/>
                        <div className={`${c}-sql-autoformat`} onClick={this.handleAutoFormatClick}>Auto-format</div>
                    </div>
                </div>
                <Constraints dataset={dataset} changeHandler={this.handleInputChange} />
            </div>
        );
    }

    /* 
     * Sets optional content.
     */
    private getStatusDependentContent = (state: AdminPanelLoadState, c: string) => {
        if (state === AdminPanelLoadState.LOADING) {
            return (
                <div>
                    <div className={`${c}-loading`}>
                        <LoaderIcon size={100} />
                    </div>
                    <div className={`${c}-loading-overlay`}/>
                </div>
            );
        } else if (state === AdminPanelLoadState.NOT_APPLICABLE) {
            return (
                <div className={`${c}-na`}>
                    <p>Saved queries cannot be edited. Please select a normal Leaf concept.</p>
                </div>
            );
        } else if (state === AdminPanelLoadState.ERROR) {
            return (
                <div className={`${c}-error`}>
                    <p>Leaf encountered an error while trying to fetch this concept.</p>
                </div>
            );
        }
        return null;
    }

    private updateExpandedDatasets = (): DatasetsState => {
        const expandedDatasets = { ... this.state.expandedDatasets };
        expandedDatasets.available = this.state.expandedDatasets.available.slice();
        expandedDatasets.available.unshift(demographics);
        return expandedDatasets;
    }

    /*
     * Triggers a fallback to unedited, undoing any current changes.
     */
    private handleUndoChanges = () => {
        const { datasets} = this.props.data;
        const { dispatch } = this.props;

        if (datasets.currentDataset!.unsaved) {
            dispatch(setAdminDataset(undefined, false));
        } else {
            dispatch(revertAdminDatasetChanges(datasets.currentDataset!));
        }
    }

    /*
     * Handles initiation of saving async changes and syncing with the DB.
     */
    private handleSaveChanges = () => {
        const { datasets} = this.props.data;
        const { dispatch } = this.props;

        if (datasets.editingDemographics) {
            dispatch(saveAdminDemographicsDataset(datasets.currentDataset!))
        } else {
            dispatch(saveAdminDataset(datasets.currentDataset as AdminDatasetQuery));
        }
    }

    /* 
     * Handles tracking of input changes to the Dataset.
     */
    private handleInputChange = (val: any, propName: string) => {
        const { datasetQueryCategories } = this.props.data;
        const { currentDataset, editingDemographics } = this.props.data.datasets;
        const { categoryIdx, datasetIdx } = this.state;
        const { dispatch } = this.props;

        if (!editingDemographics) {
            const newAdminDs = Object.assign({}, currentDataset, { [propName]: val }) as AdminDatasetQuery;
            const newDs: PatientListDatasetQueryDTO = {
                ...newAdminDs,
                category: newAdminDs.categoryId ? datasetQueryCategories.categories.get(newAdminDs.categoryId)!.category : ''
            };

            dispatch(setAdminDataset(newAdminDs, true));
            dispatch(setPatientListDatasetByIndex(newDs, categoryIdx, datasetIdx));
        } else {
            const newAdminDemogDs = Object.assign({}, currentDataset, { [propName]: val }) as AdminDatasetQuery;
            dispatch(setAdminDemographicsDataset(newAdminDemogDs, true));
        }
    }

    /*
     * Handles any direct changes to SQL input.
     */
    private handleSqlChange = (val: any) => {
        const { dispatch, data } = this.props;
        if (!data.datasets.editingDemographics) {
            dispatch(setAdminDatasetSql(val));
        } else {
            const ds: AdminDatasetQuery = { ...data.datasets.demographicsDataset!, sql: val };
            dispatch(setAdminDemographicsDataset(ds, true));
        }
        
    }

    /*
     * Handles clicks to the 'Auto-format' button, which pretty prints SQL.
     */
    private handleAutoFormatClick = () => {
        const { currentDataset } = this.props.data.datasets;
        if (currentDataset) {
            const pretty = formatSql(currentDataset.sql);
            this.handleInputChange(pretty, 'sql');
        }
    }

    /*
     * Computes the width of the SQL container. This is needed because React Ace Editor
     * requires a hard-coded width in order to have predictable size.
     */
    private getSqlWidth = (): number => {
        const max = 800;
        const min = 400;
        const sqlDom = document.getElementsByClassName(`${this.className}-sql`);
        if (sqlDom && sqlDom[0]) {
            const style = window.getComputedStyle(sqlDom[0]);
            if (style) {
                const w = +style.width!.replace('px','');
                const p = +style.paddingLeft!.replace('px','');
                const width = w - (p * 2);
                if (width < min) {
                    return min;
                } else if (width > max) {
                    return max;
                }
                return width;
            }
        }
        return max;
    }

    /*
     * Handles clicks or up/down arrow selections of datasets.
     */
    private handleDatasetSelect = (categoryIdx: number, datasetIdx: number) => {
        const { dispatch, data } = this.props;
        const { expandedDatasets } = this.state;

        if (data.datasets.state === AdminPanelLoadState.LOADING) { return; }
        if (data.datasets.changed) {
            const info: InformationModalState = {
                body: "Please save or undo your current changes first.",
                header: "Save or Undo Changes",
                show: true
            };
            dispatch(showInfoModal(info));
            return;
        }

        const ds = expandedDatasets.available[categoryIdx].datasets[datasetIdx];
        if (ds) {
            this.setState({ categoryIdx, datasetIdx });
            if (ds.shape !== PatientListDatasetShape.Demographics) {
                dispatch(fetchAdminDatasetIfNeeded(ds)); 
            } else {
                dispatch(setAdminEditingDemographics());
            }
        }
    }

    private handleShapeClick = (shape: PatientListDatasetShape) => {
        const { dispatch } = this.props;
        dispatch(setAdminDatasetShape(shape));
    }

    private handleDatasetRequest = () => null;

    private getColumnContent = (col: AdminPanelPatientListColumnTemplate) => {
        const classes = [ `${this.className}-column` ];

        if (col.optional) { classes.push('optional'); }
        if (col.present)  { classes.push('present'); }
        return (
            <div key={col.id} className={classes.join(' ')}>
                <FiCheck />
                <span>{col.id}</span>
            </div>
        );
    }
}