﻿// Copyright (c) 2019, UW Medicine Research IT, University of Washington
// Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Model.Authorization;
using Model.Compiler;
using Model.Extensions;
using Model.Search;
using Model.Tagging;
using Model.Error;
using System.Data.Common;

namespace Model.Search
{
    public class QueryManager
    {
        readonly IQueryService service;
        readonly ILogger<QueryManager> log;
        readonly IUserContext user;
        readonly PanelConverter converter;
        readonly PanelValidator validator;

        public QueryManager(
            IQueryService service,
            ILogger<QueryManager> log,
            IUserContext user,
            PanelConverter converter,
            PanelValidator validator)
        {
            this.service = service;
            this.log = log;
            this.user = user;
            this.converter = converter;
            this.validator = validator;
        }

        public async Task<IEnumerable<BaseQuery>> GetQueriesAsync()
        {
            log.LogInformation("Getting queries.");
            return await service.GetQueriesAsync();
        }

        public async Task<Query> GetQueryAsync(QueryUrn urn)
        {
            log.LogInformation("Getting query UId:{UId}", urn);
            try
            {
                return await service.GetQueryAsync(urn);
            }
            catch (DbException de)
            {
                log.LogError("Could not get query. UniversalId:{UniversalId} Code:{Code} Error:{Error}", urn, de.ErrorCode, de.Message);
                de.MapThrow();
                throw;
            }
        }

        public async Task<QueryDeleteResult> DeleteAsync(QueryUrn urn, bool force)
        {
            log.LogInformation("Deleting query. Query:{Query} Force:{Force}", urn, force);
            try
            {
                return await service.DeleteAsync(urn, force);
            }
            catch (DbException de)
            {
                log.LogError("Could not delete query. Query:{Query} Code:{Code} Error:{Error}", urn, de.ErrorCode, de.Message);
                de.MapThrow();
                throw;
            }
        }

        public async Task<SaveResult> SaveAsync(Guid id, IQuerySaveDTO ast, Func<IQueryDefinition, string> json, CancellationToken cancel)
        {

            log.LogInformation("Starting query save. Query:{Query}", id);
            var ctx = await converter.GetPanelsAsync(ast, cancel);
            if (!ctx.PreflightPassed)
            {
                return new SaveResult { State = SaveState.Preflight, Preflight = ctx.PreflightCheck };
            }
            var query = validator.Validate(ctx);

            cancel.ThrowIfCancellationRequested();

            if (!user.IsInstutional)
            {
                converter.LocalizeDefinition(ast, query);
            }

            var toSave = new QuerySave
            {
                QueryId = id,
                UniversalId = ctx.UniversalId,
                Name = ast.Name,
                Category = ast.Category,
                Definition = json(ast),
                Resources = query.Panels.GetResources()
            };
            if (ast.Ver.HasValue)
            {
                toSave.Ver = ast.Ver.Value;
            }

            try
            {

                log.LogInformation("Saving query. Query:{Query} Payload:{@Payload}", id, toSave);

                var saved = await ImplSaveAsync(toSave);
                if (saved == null)
                {
                    return new SaveResult
                    {
                        State = SaveState.NotFound,
                        Preflight = ctx.PreflightCheck,
                        Result = null
                    };
                }
                return new SaveResult
                {
                    State = SaveState.Ok,
                    Preflight = ctx.PreflightCheck,
                    Result = saved
                };
            }
            catch (DbException de)
            {
                log.LogError("Could not save query. Query:{@Query} Code:{Code} Error:{Error}", toSave, de.ErrorCode, de.Message);
                de.MapThrow();
                throw;
            }
        }

        async Task<QuerySaveResult>  ImplSaveAsync(QuerySave query)
        {
            if (query.UniversalId == null)
            {
                return await service.InitialSaveAsync(query);
            }
            return await service.UpsertSaveAsync(query);
        }

        public class SaveResult
        {
            public SaveState State { get; set; }
            public PreflightResources Preflight { get; set; }
            public QuerySaveResult Result { get; set; }
        }

        public enum SaveState
        {
            Ok,
            Preflight,
            NotFound
        }
    }
}
