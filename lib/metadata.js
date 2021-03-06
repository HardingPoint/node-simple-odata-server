/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData /$metadata request
 */

/* eslint no-redeclare:0 */

var builder = require('xmlbuilder')

module.exports = function (cfg) {
  return buildMetadata(cfg.model)
}

function buildMetadata (model) {
  var entityTypes = [];
  var navnode = null;
  for (var typeKey in model.entityTypes) {
    var entityType = {
        '@Name': typeKey,
      'Key': {},
      'Property': []
    };

    /*
    // 'NavigationProperty': []

    for (var propKey in model.entityTypes[typeKey]) {
        var property = model.entityTypes[typeKey][propKey];

        if ((propKey=='ODataRelatedTo' || propKey=='ODataRelatedFrom') && model.entityTypes[typeKey][propKey]!=null){
            for (var ODataRelatedTo in model.entityTypes[typeKey][propKey]) {
                if (ODataRelatedTo!=null && ODataRelatedTo!='null'){
                    console.log('Processing ' + propKey + ' [' + ODataRelatedTo + ']=' + model.entityTypes[typeKey][propKey][ODataRelatedTo]);
                    navnode = {
                        '@Name' : ODataRelatedTo
                    };

                    if (propKey=='ODataRelatedTo'){
                        navnode['@Type'] = model.namespace + '.' + model.entityTypes[typeKey][propKey][ODataRelatedTo];
                        navnode.ReferentialConstraint = {
                            '@Property' : 'GRAXRecordID',
                            '@ReferencedProperty' : ODataRelatedTo + '_GRAXRecordID'
                        };
                        // This will be created dynamically in recordset
                        // entityType.Property.push({'@Name': ODataRelatedTo + '_GRAXRecordID', '@Type': 'Edm.Integer', '@MaxLength':'max'})
                        // entityType.Property.push({'@Name': ODataRelatedTo + '_GRAXRecordID', '@Type': 'Edm.String',  '@Nullable':'true'})
                    }else{
                        // <NavigationProperty Name="Products" Type="Collection(NorthwindModel.Product)" Partner="Category"/>
                        navnode['@Type'] ='Collection(' + model.namespace + '.' + ODataRelatedTo + ')';
                    }
                    navnode['@Partner'] = ODataRelatedTo;
                    entityType.NavigationProperty.push(navnode);
                }
            }
        }
        else if (propKey!='ODataRelatedTo' && propKey!='ODataRelatedFrom'){
            if (property.key) {
                entityType.Key = {
                    PropertyRef: {
                        '@Name': propKey
                    }
                };
                // entityType.Property.push({'@xmlns:p5':'http://schemas.microsoft.com/ado/2009/02/edm/annotation','@Name': propKey, '@Type': property.type, '@MaxLength':'max', '@Nullable':'false','@p5:StoreGeneratedPattern':'Identity'})
                entityType.Property.push({'@xmlns:p5':'http://schemas.microsoft.com/ado/2009/02/edm/annotation','@Name': propKey, '@Type': property.type, '@MaxLength':'255', '@Nullable':'false','@p5:StoreGeneratedPattern':'Identity'})
            }
            else
                entityType.Property.push({'@Name': propKey, '@Type': property.type, '@Nullable':'true'})
                // entityType.Property.push({'@Name': propKey, '@Type': property.type, '@MaxLength':'max', '@Nullable':'false'})
        }

    }
    entityTypes.push(entityType)
  }
  */

  var complexTypes = []
  for (var typeKey in model.complexTypes) {
    var complexType = {
      '@Name': typeKey,
      'Property': []
    };

    for (var propKey in model.complexTypes[typeKey]) {
      var property = model.complexTypes[typeKey][propKey]

      complexType.Property.push({'@Name': propKey, '@Type': property.type})
    }

    complexTypes.push(complexType)
  }

  var container = {
    '@Name': 'GRAXEntities',
    '@xmlns:p4':'http://schemas.microsoft.com/ado/2009/02/edm/annotation',
    '@p4:LazyLoadingEnabled': 'true',
    'EntitySet': []
  }

  for (var setKey in model.entitySets) {
    container.EntitySet.push({
      '@Name': setKey,
      '@EntityType': model.entitySets[setKey].entityType
    })
  }

  // Below EntityType
  // 'ComplexType': complexTypes


  return builder.create({
    'edmx:Edmx': {
      '@xmlns:edmx': 'http://docs.oasis-open.org/odata/ns/edmx',
      '@Version': '4.0',
      'edmx:DataServices': {
        'Schema': [{
          '@xmlns': 'http://docs.oasis-open.org/odata/ns/edm',
          '@Namespace': model.namespace,
          'EntityType': entityTypes
        },
        {
            '@xmlns': 'http://docs.oasis-open.org/odata/ns/edm',
            '@Namespace':'grax.model',
            'EntityContainer': container
        }]
      }
    }
  }).end({pretty: true})
}
