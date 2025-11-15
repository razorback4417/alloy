import { useState } from 'react';
import { Search, Filter, Download, TrendingUp, Package, ShoppingCart, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AgentTimeline } from './AgentTimeline';
import type { Order } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface CRMDashboardProps {
  orders: Order[];
}

export function CRMDashboard({ orders }: CRMDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const totalSpend = orders.reduce((sum, order) => sum + order.amount, 0);
  const avgOrderSize = orders.length > 0 ? totalSpend / orders.length : 0;
  const successRate = orders.length > 0
    ? (orders.filter(o => o.status === 'completed').length / orders.length) * 100
    : 0;

  // Mock vendor data
  const vendors = [
    { name: 'Acme Motors Inc.', orders: 3, totalSpend: 4250, reliability: 98, whitelisted: true },
    { name: 'TechParts Supply', orders: 2, totalSpend: 2100, reliability: 95, whitelisted: true },
    { name: 'Global Components', orders: 1, totalSpend: 3420, reliability: 92, whitelisted: true },
    { name: 'PowerTech Solutions', orders: 1, totalSpend: 700, reliability: 99, whitelisted: true },
    { name: 'CableWorks Inc.', orders: 1, totalSpend: 175, reliability: 96, whitelisted: true },
  ];

  // Chart data
  const spendOverTime = [
    { month: 'Jun', amount: 4200 },
    { month: 'Jul', amount: 5800 },
    { month: 'Aug', amount: 4500 },
    { month: 'Sep', amount: 6200 },
    { month: 'Oct', amount: 5100 },
    { month: 'Nov', amount: 7520 },
  ];

  const vendorDistribution = [
    { name: 'Acme Motors', value: 4250, color: '#ff6b4a' },
    { name: 'TechParts', value: 2100, color: '#5b9bff' },
    { name: 'Global Comp.', value: 3420, color: '#a78bfa' },
    { name: 'Others', value: 875, color: '#10b981' },
  ];

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Insights & Analytics</p>
        <h2 className="text-xl text-white font-light">CRM Dashboard</h2>
      </div>

      <div className="px-8 py-6 relative z-10 animate-fade-in">
        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8 animate-stagger">
          <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-sm text-gray-400">Total Spend</span>
            </div>
            <p className="text-3xl text-white mb-1 relative z-10">${totalSpend.toFixed(2)}</p>
            <p className="text-xs text-gray-500 relative z-10">All time</p>
          </div>

          <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Avg Order Size</span>
            </div>
            <p className="text-3xl text-white mb-1 relative z-10">${avgOrderSize.toFixed(2)}</p>
            <p className="text-xs text-gray-500 relative z-10">Per transaction</p>
          </div>

          <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Total Orders</span>
            </div>
            <p className="text-3xl text-white mb-1 relative z-10">{orders.length}</p>
            <p className="text-xs text-gray-500 relative z-10">Completed</p>
          </div>

          <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-3xl text-white mb-1 relative z-10">{successRate.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 relative z-10">Transaction success</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="spend">Spend History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2a2b36] flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search orders..."
                      className="pl-10 bg-[#12131c] border-[#2a2b36] focus:border-[#5b9bff]"
                    />
                  </div>
                  <Button variant="outline" className="border-[#2a2b36] hover:bg-[#1f2029]">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button variant="outline" className="border-[#2a2b36] hover:bg-[#1f2029]">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#12131c] border-b border-[#2a2b36]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Order ID</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Date</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Vendor</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Amount</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Status</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Transaction Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className={`border-b border-[#2a2b36] hover:bg-[#1f2029] transition-colors ${
                          index === filteredOrders.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-[#5b9bff]">{order.id}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{order.vendor}</td>
                        <td className="px-6 py-4">
                          <span className="text-[#ff6b4a]">${order.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={
                                order.status === 'completed'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }
                            >
                              {order.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {order.lifecycleState?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-400">{order.transactionHash}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((vendor) => (
                <div key={vendor.name} className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg mb-1">{vendor.name}</h3>
                      {vendor.whitelisted && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Whitelisted
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Total Spend</p>
                      <p className="text-xl text-[#ff6b4a]">${vendor.totalSpend.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2b36]">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Orders</p>
                      <p className="text-lg">{vendor.orders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Reliability</p>
                      <p className="text-lg text-[#5b9bff]">{vendor.reliability}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Spend History Tab */}
          <TabsContent value="spend">
            <div className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl p-6">
              <h3 className="text-lg mb-6">Transaction Timeline</h3>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-4 bg-[#12131c] border border-[#2a2b36] rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#ff6b4a]/10 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#ff6b4a]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4>{order.vendor}</h4>
                        <span className="text-[#ff6b4a]">${order.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400">{order.id}</span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Spend Over Time Chart */}
              <div className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl p-6">
                <h3 className="text-lg mb-6">Spend Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={spendOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2b36" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1b26',
                        border: '1px solid #2a2b36',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#5b9bff" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Vendor Distribution */}
                <div className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl p-6">
                  <h3 className="text-lg mb-6">Vendor Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={vendorDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vendorDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1b26',
                          border: '1px solid #2a2b36',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {vendorDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-gray-400">${item.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-[#1a1b26] border border-[#2a2b36] rounded-xl p-6">
                  <h3 className="text-lg mb-6">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { category: 'Motors', amount: 4850 },
                      { category: 'Electronics', amount: 2100 },
                      { category: 'Power', amount: 700 },
                      { category: 'Cables', amount: 875 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2b36" />
                      <XAxis dataKey="category" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1b26',
                          border: '1px solid #2a2b36',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="amount" fill="#ff6b4a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}