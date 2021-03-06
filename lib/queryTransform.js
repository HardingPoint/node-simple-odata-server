/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Parse query string OData params and transform into mongo/nedb type of query
 */

module.exports = function (query) {
  if (query.$filter) {
    query.$filter = new Node(query.$filter.type, query.$filter.left, query.$filter.right, query.$filter.func, query.$filter.args).transform()
  } else {
    console.log('[GRAX.io] No Filter : ' + JSON.stringify(query));
    query.$filter = {}
  }

  if (query.$top) {
    query.$limit = query.$top;
  }

  if (query.$orderby) {
    query.$sort = {};
    query.$orderby.forEach(function (prop) {
      var propName = Object.keys(prop)[0];
      query.$sort[propName] = prop[propName] === 'desc' ? -1 : 1
    })
  }

  if (query.$inlinecount === 'allpages') {
    query.$count = true;
  }

  var select = {};
  for (var key in query.$select || []) {
    select[query.$select[key]] = 1;
  }
  query.$select = select;

  return query
};

function Node (type, left, right, func, args) {
  this.type = type;
  this.left = left;
  this.right = right;
  this.func = func;
  this.args = args;
}

Node.prototype.transform = function () {
  var result = {};

  console.log('[GRAX.io] this.type : ' + this.type + ' this.right.type: ' + this.right.type);
  console.log('[GRAX.io] this.left.name: ' + this.left.name + ' this.right.value: ' + this.right.value);

  if (this.type === 'eq' && this.right.type === 'literal') {
    console.log('[GRAX.io] Query Parsing - eq');
    result[this.left.name] = this.right.value
  } else if (this.type === 'lt' && this.right.type === 'literal') {
    console.log('[GRAX.io] Query Parsing - lt');
    result[this.left.name] = { '$lt': this.right.value }
  } else if (this.type === 'gt' && this.right.type === 'literal') {
    console.log('[GRAX.io] Query Parsing - gt');
    result[this.left.name] = { '$gt': this.right.value }
  } else if (this.type === 'ne' && this.right.type === 'literal') {
    console.log('[GRAX.io] Query Parsing - !=');
    result[this.left.name] = { '$ne': this.right.value }
  } else if (this.type === 'le' && this.right.type === 'literal') {
      console.log('[GRAX.io] Query Parsing - <=');
      result[this.left.name] = { '$le': this.right.value }
  } else if (this.type === 'ge' && this.right.type === 'literal') {
      console.log('[GRAX.io] Query Parsing - >=');
      result[this.left.name] = { '$ge': this.right.value }
  } else
      console.log('Exception Did Not Match Type - this.type : ' + this.type + ' this.right.type: ' + this.right.type);

  if (this.type === 'and') {
    console.log('[GRAX.io] Query Parsing - and');
    result['$and'] = result['$and'] || [];
    result['$and'].push(new Node(this.left.type, this.left.left, this.left.right, this.func, this.args).transform());
    result['$and'].push(new Node(this.right.type, this.right.left, this.right.right, this.func, this.args).transform())
  }
  else if (this.type === 'or') {
    console.log('[GRAX.io] Query Parsing - or');
    result['$or'] = result['$or'] || [];
    result['$or'].push(new Node(this.left.type, this.left.left, this.left.right, this.func, this.args).transform());
    result['$or'].push(new Node(this.right.type, this.right.left, this.right.right, this.func, this.args).transform())
  }
  else if (this.type === 'functioncall') {
    console.log('[GRAX.io] Query Parsing - functioncall ' + this.func);
    switch (this.func) {
      case 'substringof': substringof(this, result)
    }
  } else {
    console.log(" Exception : Could not match Type " + this.type);
  }

  return result
};

function substringof (node, result) {
  var prop = node.args[0].type === 'property' ? node.args[0] : node.args[1];
  var lit = node.args[0].type === 'literal' ? node.args[0] : node.args[1];
  result[prop.name] = new RegExp(lit.value)
}
